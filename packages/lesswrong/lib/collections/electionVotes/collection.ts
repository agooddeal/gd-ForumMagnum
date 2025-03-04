import { createCollection } from "../../vulcan-lib/collections";
import { isAdmin, userOwns } from "../../vulcan-users/permissions";
import { isPastVotingDeadline, userCanVoteInDonationElection } from "./helpers";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

const ElectionVotes: ElectionVotesCollection = createCollection({
  collectionName: "ElectionVotes",
  typeName: "ElectionVote",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ElectionVotes', {electionName: 1});
    indexSet.addIndex('ElectionVotes', {electionName: 1, userId: 1}, {unique: true});
    return indexSet;
  },
  resolvers: getDefaultResolvers("ElectionVotes"),
  mutations: getDefaultMutations("ElectionVotes", {
    newCheck: (user: DbUser|null) => {
      if (!user) return false;
      if (isAdmin(user)) return true;

      if (!userCanVoteInDonationElection(user)) {
        throw new Error("Accounts created after 22nd Oct 2023 cannot vote in this election");
      }
      if (isPastVotingDeadline()) {
        throw new Error("Voting has closed");
      }

      return true;
    },
    editCheck: async (user: DbUser|null, document: DbElectionVote|null) => {
      if (!user || !document) return false;
      if (isAdmin(user)) return true;

      if (!userCanVoteInDonationElection(user)) {
        throw new Error("Accounts created after 22nd Oct 2023 cannot vote in this election");
      }
      if (isPastVotingDeadline()) {
        throw new Error("Voting has closed, you can no longer edit your vote");
      }
      if (userOwns(user, document)) return true;

      return false;
    },
  }),
  logChanges: true,
});

addUniversalFields({
  collection: ElectionVotes,
});

export default ElectionVotes;
