import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * This collection stores information about the LessWrong Annual Review winners, used primarily for sort orderings
 */
export const ReviewWinnerArts = createCollection({
  collectionName: 'ReviewWinnerArts',
  typeName: 'ReviewWinnerArt',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ReviewWinnerArts', { postId: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('ReviewWinnerArts'),
  logChanges: true,
});


export default ReviewWinnerArts;
