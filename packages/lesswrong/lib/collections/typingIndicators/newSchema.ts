// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { userOwns } from "../../vulcan-users/permissions";
import { getFillIfMissing } from "@/lib/utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"TypingIndicators">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  userId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  documentId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  lastUpdated: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["members"],
      canUpdate: [userOwns],
      canCreate: ["members"],
    },
  },
};

export default schema;
