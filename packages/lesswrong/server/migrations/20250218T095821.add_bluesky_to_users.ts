import Users from "@/server/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Users, "blueskyProfileURL");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Users, "blueskyProfileURL");
}
