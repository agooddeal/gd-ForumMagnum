import { createCollection } from '@/lib/vulcan-lib/collections';
import { userCanUseTags } from '@/lib/betas';
import { canVoteOnTagAsync } from '@/lib/voting/tagRelVoteRules';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import schema from '@/lib/collections/tagRels/schema';

export const TagRels: TagRelsCollection = createCollection({
  collectionName: 'TagRels',
  typeName: 'TagRel',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('TagRels', {postId: 1});
    indexSet.addIndex('TagRels', {tagId: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers('TagRels'),
  mutations: getDefaultMutations('TagRels', {
    newCheck: (user: DbUser|null, tag: DbTagRel|null) => {
      return userCanUseTags(user);
    },
    editCheck: (user: DbUser|null, tag: DbTagRel|null) => {
      return userCanUseTags(user);
    },
    removeCheck: (user: DbUser|null, tag: DbTagRel|null) => {
      return false;
    },
  }),
  voteable: {
    timeDecayScoresCronjob: true,
    userCanVoteOn: (
      user: DbUser,
      document: DbTagRel,
      voteType: string|null,
      _extendedVote: any,
      context: ResolverContext,
    ) => canVoteOnTagAsync(user, document.tagId, document.postId, context, voteType ?? 'neutral'),
  },
});

export default TagRels;
