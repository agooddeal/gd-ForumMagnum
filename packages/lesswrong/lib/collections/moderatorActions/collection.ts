import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * Creating a moderator action sets a note on the user's profile for moderators
 * to see, and triggers a review if necessary.
 *
 * Pass currentUser to createMutator to set the moderator who created the
 * action. Do *not* pass currentUser if the currentUser is the user themselves.
 * Setting currentUser to null (and validate to false) will create the action as
 * 'Automod'.
 */
export const ModeratorActions: ModeratorActionsCollection = createCollection({
  collectionName: 'ModeratorActions',
  typeName: 'ModeratorAction',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ModeratorActions', { userId: 1, createdAt: -1 })
    indexSet.addIndex('ModeratorActions', { type: 1, createdAt: -1, endedAt: -1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('ModeratorActions'),
  mutations: getDefaultMutations('ModeratorActions'),
  logChanges: true,
});

export default ModeratorActions;
