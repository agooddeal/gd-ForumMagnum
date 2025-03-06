import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import schema from '@/lib/collections/googleServiceAccountSessions/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";

const options: MutationOptions<DbGoogleServiceAccountSession> = {
  newCheck: (user: DbUser|null, document: DbGoogleServiceAccountSession|null) => {
    if (!user || !document) return false;
    return userIsAdmin(user)
  },
  editCheck: (user: DbUser|null, document: DbGoogleServiceAccountSession|null) => {
    if (!user || !document) return false;
    return userIsAdmin(user)
  },
  removeCheck: (user: DbUser|null, document: DbGoogleServiceAccountSession|null) => {
    if (!user || !document) return false;
    return userIsAdmin(user)
  },
}

export const GoogleServiceAccountSessions: GoogleServiceAccountSessionsCollection = createCollection({
  collectionName: 'GoogleServiceAccountSessions',
  typeName: 'GoogleServiceAccountSession',
  schema,
  resolvers: getDefaultResolvers('GoogleServiceAccountSessions'),
  mutations: getDefaultMutations('GoogleServiceAccountSessions', options),
  logChanges: false,
});


export default GoogleServiceAccountSessions;
