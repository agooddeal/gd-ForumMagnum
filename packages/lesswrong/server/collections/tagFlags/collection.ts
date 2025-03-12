import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import '@/lib/collections/tagFlags/fragments'
import { userCanDo } from '@/lib/vulcan-users/permissions';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import schema from '@/lib/collections/tagFlags/schema';

const options: MutationOptions<DbTagFlag> = {
  newCheck: (user: DbUser|null, document: DbTagFlag|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `tagFlags.new`)
  },

  editCheck: (user: DbUser|null, document: DbTagFlag|null) => {
    if (!user || !document) return false;
    return userCanDo(user, `tagFlags.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbTagFlag|null) => {
    // Nobody should be allowed to remove documents completely from the DB. 
    // Deletion is handled via the `deleted` flag.
    return false
  },
}

export const TagFlags: TagFlagsCollection = createCollection({
  collectionName: 'TagFlags',
  typeName: 'TagFlag',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('TagFlags', {deleted: 1, order: 1, name: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers('TagFlags'),
  mutations: getDefaultMutations('TagFlags', options),
  logChanges: true,
});


export default TagFlags;

