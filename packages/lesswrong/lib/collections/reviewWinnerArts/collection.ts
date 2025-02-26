import { createCollection } from '../../vulcan-lib/collections';
import { MutationOptions, getDefaultMutations } from '../../vulcan-core/default_mutations';
import { schema } from './schema';
import { userIsAdminOrMod } from '../../vulcan-users/permissions';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const reviewWinnerArtMutationOptions: MutationOptions<DbReviewWinnerArt> = {
  newCheck: (user: DbUser|null) => {
    return userIsAdminOrMod(user);
  },

  editCheck: (user: DbUser|null) => {
    return userIsAdminOrMod(user);
  },

  removeCheck: () => {
    return false;
  },
}

/**
 * This collection stores information about the LessWrong Annual Review winners, used primarily for sort orderings
 */
export const ReviewWinnerArts = createCollection({
  collectionName: 'ReviewWinnerArts',
  typeName: 'ReviewWinnerArt',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ReviewWinnerArts', { postId: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('ReviewWinnerArts'),
  mutations: getDefaultMutations('ReviewWinnerArts', reviewWinnerArtMutationOptions),
  logChanges: true,
});

addUniversalFields({
  collection: ReviewWinnerArts,
});

export default ReviewWinnerArts;
