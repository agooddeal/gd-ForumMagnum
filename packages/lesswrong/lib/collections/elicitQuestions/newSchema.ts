// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { getFillIfMissing } from "@/lib/utils/schemaUtils";

const commonFields = (nullable: boolean) => ({
  hidden: true,
  required: false,
  canCreate: ["members" as const, "sunshineRegiment" as const],
  canRead: ["guests" as const],
  canUpdate: ["admins" as const],
  optional: nullable,
  nullable,
});

const schema: Record<string, NewCollectionFieldSpecification<"ElicitQuestions">> = {
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
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "sunshineRegiment"],
    },
  },
  notes: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "sunshineRegiment"],
    },
  },
  resolution: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "sunshineRegiment"],
    },
  },
  resolvesBy: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["members", "sunshineRegiment"],
    },
  },
};

export default schema;
