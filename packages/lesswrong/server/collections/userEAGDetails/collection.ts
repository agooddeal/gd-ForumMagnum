import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const UserEAGDetails: UserEAGDetailsCollection = createCollection({
  collectionName: 'UserEAGDetails',
  typeName: 'UserEAGDetail',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('UserEAGDetails', { userId: 1 }, { unique: true });
    return indexSet;
  },
  resolvers: getDefaultResolvers('UserEAGDetails'),
  logChanges: true,
});


export default UserEAGDetails;
