import { registerMigration } from "./migrationUtils";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { karmaChangeNotifierDefaultSettings } from "@/lib/collections/users/schema";
import Users from "@/lib/collections/users/collection";

/**
 * For A/B testing: When running locally this will be set to a control group of 50
 * moderately active users.
 *
 * TODO generate list
 */
const USERS_MANUALLY_EXCLUDED: string[] = [];

registerMigration({
  name: "updateKarmaNotifDefault",
  dateWritten: "2025-02-14",
  idempotent: true,
  action: async () => {
    const db = getSqlClientOrThrow();

    const everChangedSettingUsers = (await db.any<{userId: string}>(`
      SELECT DISTINCT "documentId" AS "userId"
      FROM "LWEvents"
      WHERE "name" = 'fieldChanges'
        AND properties -> 'before' ->> 'karmaChangeNotifierSettings' IS NOT NULL
        AND properties -> 'after' ->> 'karmaChangeNotifierSettings' IS NOT NULL
        AND properties -> 'before' ->> 'karmaChangeNotifierSettings' <> properties -> 'after' ->> 'karmaChangeNotifierSettings';
    `)).map(u => u.userId);

    const usersToExclude = [...new Set(USERS_MANUALLY_EXCLUDED.concat(everChangedSettingUsers))]

    await Users.rawUpdateMany(
      { _id: { $nin: usersToExclude } },
      { $set: { karmaChangeNotifierSettings: karmaChangeNotifierDefaultSettings.get() } }
    );
  },
});
