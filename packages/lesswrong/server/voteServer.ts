import { createMutator } from './vulcan-lib/mutators';
import Votes from '../lib/collections/votes/collection';
import { userCanDo } from '../lib/vulcan-users/permissions';
import { recalculateScore } from '../lib/scoring';
import { isValidVoteType } from '../lib/voting/voteTypes';
import { VoteDocTuple, getVotePower } from '../lib/voting/vote';
import { getVotingSystemForDocument, VotingSystem } from '../lib/voting/votingSystems';
import { createAnonymousContext } from './vulcan-lib/query';
import { randomId } from '../lib/random';
import { getConfirmedCoauthorIds } from '../lib/collections/posts/helpers';
import { ModeratorActions } from '../lib/collections/moderatorActions/collection';
import { RECEIVED_VOTING_PATTERN_WARNING, POTENTIAL_TARGETED_DOWNVOTING } from '../lib/collections/moderatorActions/schema';
import { loadByIds } from '../lib/loaders';
import { filterNonnull } from '../lib/utils/typeGuardUtils';
import moment from 'moment';
import * as _ from 'underscore';
import sumBy from 'lodash/sumBy'
import uniq from 'lodash/uniq';
import keyBy from 'lodash/keyBy';
import { voteButtonsDisabledForUser } from '../lib/collections/users/helpers';
import { elasticSyncDocument } from './search/elastic/elasticCallbacks';
import { collectionIsSearchIndexed } from '../lib/search/searchUtil';
import { isElasticEnabled } from './search/elastic/elasticSettings';
import {Posts} from '../lib/collections/posts';
import { VotesRepo } from './repos';
import { isLWorAF } from '../lib/instanceSettings';
import { swrInvalidatePostRoute } from './cache/swr';
import { onCastVoteAsync, onVoteCancel } from './callbacks/votingCallbacks';
import { getVoteAFPower } from './callbacks/alignment-forum/callbacks';

// Test if a user has voted on the server
const getExistingVote = async ({ document, user }: {
  document: DbVoteableType,
  user: DbUser,
}) => {
  return await Votes.findOne({
    documentId: document._id,
    userId: user._id,
    cancelled: false,
  });
}

// Add a vote of a specific type on the server
const addVoteServer = async ({ document, collection, voteType, extendedVote, user, voteId, context }: {
  document: DbVoteableType,
  collection: CollectionBase<VoteableCollectionName>,
  voteType: DbVote['voteType'],
  extendedVote: any,
  user: DbUser,
  voteId: string,
  context: ResolverContext,
}): Promise<VoteDocTuple> => {
  // create vote and insert it
  const partialVote = createVote({ document, collectionName: collection.options.collectionName, voteType, extendedVote, user, voteId });
  const {data: vote} = await createMutator({
    collection: Votes,
    document: partialVote,
    validate: false,
  });

  let newDocument = {
    ...document,
    ...(await recalculateDocumentScores(document, context)),
  }
  
  // update document score & set item as active
  await collection.rawUpdateOne(
    {_id: document._id},
    {
      $set: {
        inactive: false,
        baseScore: newDocument.baseScore,
        score: newDocument.score,
        extendedScore: newDocument.extendedScore,
      },
    },
    {}
  );
  if (isElasticEnabled && collectionIsSearchIndexed(collection.collectionName)) {
    void elasticSyncDocument(collection.collectionName, newDocument._id);
  }
  if (collection.collectionName === "Posts") {
    void swrInvalidatePostRoute(newDocument._id)
  }
  return {newDocument, vote};
}

// Create new vote object
export const createVote = ({ document, collectionName, voteType, extendedVote, user, voteId }: {
  document: DbVoteableType,
  collectionName: CollectionNameString,
  voteType: DbVote['voteType'],
  extendedVote: any,
  user: DbUser|UsersCurrent,
  voteId?: string,
}): Partial<DbVote> => {
  let authorIds = document.userId ? [document.userId] : []
  if (collectionName === "Posts")
    authorIds = authorIds.concat(getConfirmedCoauthorIds(document as DbPost))

  return {
    // when creating a vote from the server, voteId can sometimes be undefined
    ...(voteId ? {_id:voteId} : undefined),
    
    documentId: document._id,
    collectionName,
    userId: user._id,
    voteType: voteType,
    extendedVoteType: extendedVote,
    power: getVotePower({user, voteType, document}),
    afPower: getVoteAFPower({user, voteType, document}),
    votedAt: new Date(),
    authorIds,
    cancelled: false,
    documentIsAf: !!(document.af),
  }
};

// Clear all votes for a given document and user (server)
export const clearVotesServer = async ({ document, user, collection, excludeLatest, silenceNotification=false, context }: {
  document: DbVoteableType,
  user: DbUser,
  collection: CollectionBase<VoteableCollectionName>,
  // If true, clears all votes except the latest (ie, only clears duplicate
  // votes). If false, clears all votes (including the latest).
  excludeLatest?: boolean,
  /**
   * If true, notifies the user of the karma changes from this vote. This will be true
   * except for votes being nullified by mods.
   */
  silenceNotification?: boolean,
  context: ResolverContext,
}) => {
  let newDocument = _.clone(document);
  
  // Fetch existing, uncancelled votes
  const votes = await Votes.find({
    documentId: document._id,
    userId: user._id,
    cancelled: false,
  }).fetch();
  if (!votes.length) {
    return newDocument;
  }
  
  const latestVoteId = _.max(votes, v=>v.votedAt)?._id;
  const votesToCancel = excludeLatest
    ? votes.filter(v=>v._id!==latestVoteId)
    : votes
  
  // Mark the votes as cancelled in the DB, with findOneAndUpdate. If any of
  // these doesn't return a result, it means `cancelled` was set to true in a
  // concurrent operation, and that other operation is the one responsible for
  // running the vote-canceled callbacks (which do the user-karma updates).
  //
  // If this was done the more straightforward way, then hitting vote buttons
  // quickly could lead to votes getting double-cancelled; this doesn't affect
  // the score of the document (which is recomputed from scratch each time) but
  // does affect the user's karma. We used to have a bug like that.
  const voteCancellations = await Promise.all(
    votesToCancel.map((vote) => Votes.rawCollection().findOneAndUpdate({
      _id: vote._id,
      cancelled: false,
    }, {
      $set: { cancelled: true }
    }))
  );
  
  for (let voteCancellation of voteCancellations) {
    const vote = voteCancellation?.value;
    if (!vote) continue;
    
    //eslint-disable-next-line no-unused-vars
    const {_id, ...otherVoteFields} = vote;
    // Create an un-vote for each of the existing votes
    const unvote = {
      ...otherVoteFields,
      cancelled: true,
      isUnvote: true,
      power: -vote.power,
      afPower: -vote.afPower,
      votedAt: new Date(),
      silenceNotification,
    };
    await createMutator({
      collection: Votes,
      document: unvote,
      validate: false,
    });

    await onVoteCancel(newDocument, vote, collection, user);
  }
  const newScores = await recalculateDocumentScores(document, context);
  await collection.rawUpdateOne(
    {_id: document._id},
    {
      $set: {...newScores },
    },
    {}
  );
  newDocument = {
    ...newDocument,
    ...newScores,
  };
  if (isElasticEnabled && collectionIsSearchIndexed(collection.collectionName)) {
    void elasticSyncDocument(collection.collectionName, newDocument._id);
  }
  return newDocument;
}

// Server-side database operation
export const performVoteServer = async ({ documentId, document, voteType, extendedVote, collection, voteId = randomId(), user, toggleIfAlreadyVoted = true, skipRateLimits, context, selfVote = false }: {
  documentId?: string,
  document?: DbVoteableType|null,
  voteType: DbVote['voteType'],
  extendedVote?: any,
  collection: CollectionBase<VoteableCollectionName>,
  voteId?: string,
  user: DbUser,
  toggleIfAlreadyVoted?: boolean,
  skipRateLimits: boolean,
  context?: ResolverContext,
  selfVote?: boolean,
}): Promise<{
  modifiedDocument: DbVoteableType,
  showVotingPatternWarning: boolean,
}> => {
  if (!context)
    context = createAnonymousContext();

  const collectionName = collection.options.collectionName;
  document = document || await collection.findOne({_id: documentId});

  if (!document) throw new Error("Error casting vote: Document not found.");
  
  const collectionVoteType = `${collectionName.toLowerCase()}.${voteType}`

  if (!user) throw new Error("Error casting vote: Not logged in.");
  
  // Check whether the user is allowed to vote at all, in full generality
  const { fail: cannotVote, reason } = voteButtonsDisabledForUser(user);
  if (!selfVote && cannotVote) {
    throw new Error(reason);
  }

  if (!extendedVote && voteType && voteType !== "neutral" && !userCanDo(user, collectionVoteType)) {
    throw new Error(`Error casting vote: User can't cast votes of type ${collectionVoteType}.`);
  }
  if (!isValidVoteType(voteType)) throw new Error(`Invalid vote type in performVoteServer: ${voteType}`);

  if (!selfVote && collectionName === "Comments" && (document as DbComment).debateResponse) {
    const post = await Posts.findOne({_id: (document as DbComment).postId});
    const acceptedCoauthorIds = post ? [...getConfirmedCoauthorIds(post), post.userId] : [];
    if (!acceptedCoauthorIds.includes(user._id)) {
      throw new Error("Cannot vote on debate responses unless you're an accepted coauthor");
    }
  }

  if (collectionName==="Revisions" && (document as DbRevision).collectionName!=='Tags')
    throw new Error("Revisions are only voteable if they're revisions of tags");
  
  const existingVote = await getExistingVote({document, user});
  let showVotingPatternWarning = false;

  if (existingVote && existingVote.voteType === voteType && !extendedVote) {
    if (toggleIfAlreadyVoted) {
      document = await clearVotesServer({document, user, collection, context})
    }
  } else {
    if (!skipRateLimits) {
      const { moderatorActionType } = await checkVotingRateLimits({ document, collection, voteType, user });
      if (moderatorActionType && !(await wasVotingPatternWarningDeliveredRecently(user, moderatorActionType))) {
        if (moderatorActionType === RECEIVED_VOTING_PATTERN_WARNING) showVotingPatternWarning = true;
        void createMutator({
          collection: ModeratorActions,
          context,
          currentUser: null,
          validate: false,
          document: {
            userId: user._id,
            type: moderatorActionType,
          }
        });
      }
    }
    
    const votingSystem = await getVotingSystemForDocument(document, context);
    if (extendedVote && votingSystem.isAllowedExtendedVote) {
      const oldExtendedScore = document.extendedScore;
      const extendedVoteCheckResult = votingSystem.isAllowedExtendedVote(user, document, oldExtendedScore, extendedVote)
      if (!extendedVoteCheckResult.allowed) {
        throw new Error(extendedVoteCheckResult.reason);
      }
    }

    let voteDocTuple: VoteDocTuple = await addVoteServer({document, user, collection, voteType, extendedVote, voteId, context});

    document = voteDocTuple.newDocument;
    document = await clearVotesServer({
      document, user, collection,
      excludeLatest: true,
      context
    })

    voteDocTuple.newDocument = document
    
    void onCastVoteAsync(voteDocTuple, collection, user, context);
  }

  (document as any).__typename = collection.options.typeName;
  return {
    modifiedDocument: document,
    showVotingPatternWarning,
  };
}

async function wasVotingPatternWarningDeliveredRecently(user: DbUser, moderatorActionType: DbModeratorAction["type"]): Promise<boolean> {
  const mostRecentWarning = await ModeratorActions.findOne({
    userId: user._id,
    type: moderatorActionType,
  }, {
    sort: {createdAt: -1}
  });
  if (!mostRecentWarning?.createdAt) {
    return false;
  }
  const warningAgeMS = new Date().getTime() - mostRecentWarning.createdAt.getTime()
  const warningAgeMinutes = warningAgeMS / (1000*60);
  return warningAgeMinutes < 60;
}

// TODO consequences to add, not yet implemented: blockVotingFor24Hours, revertRecentVotes
type Consequence = "warningPopup" | "denyThisVote" | "flagForModeration"

interface VotingRateLimit {
  voteCount: number | ((postCommentCount: number|null) => number)
  /** If provided, periodInMinutes must be ≤ than 24 hours. At least one of periodInMinutes or allOnSamePost must be provided. */
  periodInMinutes: number|null,
  allOnSamePost?: true,
  types: "all"|"onlyStrong"|"onlyDown"
  users: "allUsers"|"singleUser"
  consequences: Consequence[]
  message: string|null
}

const getVotingRateLimits = (user: DbUser): VotingRateLimit[] => {
  if (user?.isAdmin) {
    return [];
  } else {
    const rateLimits: VotingRateLimit[] = [
      {
        voteCount: 200,
        periodInMinutes: 60 * 24,
        types: "all",
        users: "allUsers",
        consequences: ["denyThisVote"],
        message: "too many votes in one day",
      },
      {
        voteCount: 100,
        periodInMinutes: 60,
        types: "all",
        users: "allUsers",
        consequences: ["denyThisVote"],
        message: "too many votes in one hour",
      },
      {
        voteCount: 100,
        periodInMinutes: 24*60,
        types: "all",
        users: "singleUser",
        consequences: ["denyThisVote"],
        message: "too many votes today on content by this author",
      },
      {
        voteCount: 9,
        periodInMinutes: 2,
        types: "onlyDown",
        users: "singleUser",
        consequences: ["flagForModeration"],
        message: "too many votes in short succession on content by this author",
      },
      {
        voteCount: 10,
        periodInMinutes: 3,
        types: "all",
        users: "singleUser",
        consequences: ["warningPopup"],
        message: null,
      },
      {
        voteCount: 10,
        periodInMinutes: 60,
        types: "onlyStrong",
        users: "allUsers",
        consequences: ["denyThisVote"],
        message: "too many strong-votes in one hour",
      },
      {
        voteCount: (postCommentCount: number|null) => 5 + Math.round((postCommentCount??0) * .05),
        periodInMinutes: null,
        allOnSamePost: true,
        types: "onlyStrong",
        users: "allUsers",
        consequences: ["denyThisVote"],
        message: "You can only strong-vote on up to (5+5%) of the comments on a post",
      },
    ];

    return rateLimits;
  }
}

/**
 * Check whether a given vote would exceed voting rate limits. If this vote
 * should be blocked, throws an exception with a message describing why. If it
 * shouldn't be blocked but should give the user a message warning them about
 * site rules, returns {showVotingPatternWarning: true}. Otherwise returns
 * {showVotingPattern: false}.
 *
 * May also add apply voting-related consequences such as flagging the user for
 * moderation, as side effects.
 */
const checkVotingRateLimits = async ({ document, collection, voteType, user }: {
  document: DbVoteableType,
  collection: CollectionBase<VoteableCollectionName>,
  voteType: string,
  user: DbUser
}): Promise<{
  moderatorActionType?: DbModeratorAction["type"]
}> => {
  // No rate limit on self-votes
  if(document.userId === user._id)
    return {};
  
  // Retrieve all non-cancelled votes cast by this user that were either cast
  // in the past 24 hours, or are on comments on the same post as this one
  const oneDayAgo = moment().subtract(1, 'days').toDate();
  const postId = (document as any)?.postId ?? null;
  const [votesInLastDay, votesOnCommentsOnThisPost, postWithCommentCount] = await Promise.all([
    Votes.find({
      userId: user._id,
      authorIds: {$ne: user._id}, // Self-votes don't count
      votedAt: {$gt: oneDayAgo},
      cancelled:false
    }).fetch(),
    postId ? new VotesRepo().getVotesOnSamePost({
      userId: user._id,
      postId,
      excludedDocumentId: document._id
    }) : [],
    postId ? await Posts.findOne({_id: postId}, {}, {commentCount: 1}) : null,
  ]);

  // If this is a vote on a comment on a post, fetch the comment-count of that
  // post to use for percentage-based rate limits.
  const postCommentCount: number|null = postWithCommentCount?.commentCount ?? null;
  
  // Go through rate limits checking if each applies. If more than one rate
  // limit applies, we take the union of the consequences of exceeding all of
  // them, and use the message from whichever was first in the list.
  let firstExceededRateLimit: VotingRateLimit|null = null;
  let rateLimitConsequences = new Set<Consequence>();
  
  for (const rateLimit of getVotingRateLimits(user)) {
    let votesToConsider = rateLimit.allOnSamePost
      ? votesOnCommentsOnThisPost
      : votesInLastDay;

    const limitVoteCount = (typeof rateLimit.voteCount==='function')
      ? rateLimit.voteCount(postCommentCount)
      : rateLimit.voteCount;
    if (votesToConsider.length < limitVoteCount) {
      continue;
    }
    if (rateLimit.types === "onlyDown" && !voteTypeIsDown(voteType)) {
      continue;
    }
    if (rateLimit.types === "onlyStrong" && !voteTypeIsStrong(voteType)) {
      continue;
    }

    const numMatchingVotes = getRelevantVotes(rateLimit, document, votesToConsider).length;
    
    if (numMatchingVotes >= limitVoteCount) {
      if (!firstExceededRateLimit) {
        firstExceededRateLimit = rateLimit;
      }
      for (let consequence of rateLimit.consequences) {
        rateLimitConsequences.add(consequence);
      }
    }
  }
  
  // Was any rate limit exceeded?
  let moderatorActionType: DbModeratorAction["type"] | undefined = undefined;

  if (firstExceededRateLimit) {
    if (rateLimitConsequences.has("warningPopup")) {
      moderatorActionType = RECEIVED_VOTING_PATTERN_WARNING;
    }
    if (rateLimitConsequences.has("denyThisVote")) {
      const message = firstExceededRateLimit.message;
      if (message) {
        throw new Error(`Voting rate limit exceeded: ${message}`);
      } else {
        throw new Error(`Voting rate limit exceeded`);
      }
    }
    if (rateLimitConsequences.has("flagForModeration")) {
      moderatorActionType = POTENTIAL_TARGETED_DOWNVOTING;
    }
  }

  return { moderatorActionType };
}

function getRelevantVotes(
  rateLimit: VotingRateLimit,
  document: DbVoteableType,
  votes: DbVote[],
): DbVote[] {
  const now = new Date().getTime();

  return votes.filter(vote => {
    const ageInMS = now - vote.votedAt.getTime();
    const ageInMinutes = ageInMS / (1000 * 60);

    if (rateLimit.periodInMinutes && ageInMinutes > rateLimit.periodInMinutes) {
      return false;
    }
    
    if (rateLimit.users === "singleUser" && !!document.userId &&!vote.authorIds?.includes(document.userId))
      return false;

    const isStrong = voteTypeIsStrong(vote.voteType);
    const isDown = voteTypeIsDown(vote.voteType);
    if (rateLimit.types === "onlyStrong" && !isStrong)
      return false;
    if (rateLimit.types === "onlyDown" && !isDown)
      return false;
    return true;
  })
}

function voteTypeIsStrong(voteType: string): boolean {
  return voteType==="bigDownvote" || voteType==="bigUpvote";
}

function voteTypeIsDown(voteType: string): boolean {
  return voteType==="bigDownvote" || voteType==="smallDownvote";
}

function voteHasAnyEffect(votingSystem: VotingSystem, vote: DbVote, af: boolean) {
  // Exclude neutral votes (i.e. those without a karma change) from the vote count,
  // because it causes confusion in the UI
  if (vote.voteType === 'neutral') {
    return false;
  }
  
  if (af) {
    return !!vote.afPower;
  } else {
    return !!vote.power;
  }
}

export const recalculateDocumentScores = async (document: VoteableType, context: ResolverContext) => {
  const votes = await Votes.find(
    {
      documentId: document._id,
      cancelled: false
    }, {
      // This sort order eventually winds up affecting the sort-order of
      // users-who-reacted in the UI
      sort: {
        votedAt: 1
      }
    }
  ).fetch() || [];
  
  const userIdsThatVoted = uniq(votes.map(v=>v.userId));
  // make sure that votes associated with users that no longer exist get ignored for the AF score
  const usersThatVoted = await loadByIds(context, "Users", userIdsThatVoted);
  const usersThatVotedById = keyBy(filterNonnull(usersThatVoted), u=>u._id);
  
  const afVotes = _.filter(votes, v=>userCanDo(usersThatVotedById[v.userId], "votes.alignment"));

  const votingSystem = await getVotingSystemForDocument(document, context);
  const nonblankVoteCount = votes.filter(v => (!!v.voteType && v.voteType !== "neutral") || votingSystem.isNonblankExtendedVote(v)).length;
  
  const baseScore = sumBy(votes, v=>v.power)
  const afBaseScore = sumBy(afVotes, v=>v.afPower ?? 0)
  
  const voteCount = _.filter(votes, v=>voteHasAnyEffect(votingSystem, v, false)).length;
  const afVoteCount = _.filter(afVotes, v=>voteHasAnyEffect(votingSystem, v, true)).length;
  
  return {
    baseScore, afBaseScore,
    voteCount: voteCount,
    afVoteCount: afVoteCount,
    extendedScore: await votingSystem.computeExtendedScore(votes, context),
    afExtendedScore: await votingSystem.computeExtendedScore(afVotes, context),
    score: recalculateScore({...document, baseScore})
  };
}
