// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle } from "../../utils/schemaUtils";

const schema = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      onUpdate: () => 1,
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  updatedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  /** The start of the time window this row is counting over. Currently (2024-01-18) all windows are full UTC days */
  windowStart: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  /** The end of the time window this row is counting over. Currently (2024-01-18) all windows are full UTC days */
  windowEnd: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  /** The clientId of the person viewing the post */
  clientId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ClientIds",
      nullable: false,
    },
    // I am pretty confused by what this was supposed to be doing.
    // In the original schema, this was a foreignKeyField without a `canRead`,
    // so the resolver couldn't actually be used except maybe internally via e.g. `fetchFragment`
    // (and it wasn't, afaict).
    // Maybe it was just for the foreign key annotation?
    // So this is probably safe to get rid of.
    graphql: {
      outputType: "ClientId",
      canRead: [],
      resolver: generateIdResolverSingle({ foreignCollectionName: "ClientIds", fieldName: "clientId" }),
    },
  },
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
  },
  post: {
    graphql: {
      outputType: "Post!",
      canRead: [],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  /** The total number of seconds the given clientId spent on this post, in the given time window */
  totalSeconds: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"PostViewTimes">>;

export default schema;
