// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import {
    accessFilterSingle,
    accessFilterMultiple, generateIdResolverSingle,
    getFillIfMissing,
    throwIfSetToNull
} from "../../utils/schemaUtils";
import { getWithCustomLoader } from "../../loaders";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import { documentIsNotDeleted, userOwns } from "../../vulcan-users/permissions";
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";

const formGroups: Partial<Record<string, FormGroupType<"Sequences">>> = {
  adminOptions: {
    name: "adminOptions",
    order: 2,
    label: preferredHeadingCase("Admin Options"),
    startCollapsed: false,
  },
  advancedOptions: {
    name: "advancedOptions",
    order: 3,
    label: preferredHeadingCase("Advanced Options"),
    startCollapsed: true,
  },
};

const schema: Record<string, NewCollectionFieldSpecification<"Sequences">> = {
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
  contents: {
    graphql: {
      type: "Revision",
      canRead: [documentIsNotDeleted],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        simpleSchema: RevisionStorageType,
      },
      resolver: getDenormalizedEditableResolver("Sequences", "contents"),
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "contents",
        collectionName: "Sequences",
        commentEditor: false,
        commentStyles: false,
        hideControls: false,
      },
      order: 20,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Sequences"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  contents_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  revisions: {
    graphql: {
      type: "[Revision]",
      canRead: ["guests"],
      resolver: getRevisionsResolver("revisions"),
    },
  },
  version: {
    graphql: {
      type: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("version"),
    },
  },
  lastUpdated: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      form: { label: "Set author" },
      control: "FormUserSelect",
      group: () => formGroups.adminOptions,
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "Sequences", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  title: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
    },
    form: {
      order: 10,
      control: "EditSequenceTitle",
      placeholder: "Sequence title",
    },
  },
  bannerImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
    },
    form: {
      label: "Banner Image",
      control: "ImageUpload",
    },
  },
  gridImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
    },
    form: {
      label: "Card Image",
      control: "ImageUpload",
    },
  },
  hideFromAuthorPage: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Hide from my user profile",
    },
  },
  draft: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      control: "checkbox",
    },
  },
  isDeleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Delete",
      tooltip: "Make sure you want to delete this sequence - it will be completely hidden from the forum.",
      control: "checkbox",
      group: () => formGroups.advancedOptions,
    },
  },
  curatedOrder: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  userProfileOrder: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  canonicalCollectionSlug: {
    database: {
      type: "TEXT",
      foreignKey: { collection: "Collections", field: "slug" },
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      label: "Collection slug",
      tooltip:
        "The machine-readable slug for the collection this sequence belongs to. Will affect links, so don't set it unless you have the slug exactly right.",
      control: "text",
      hidden: false,
      group: () => formGroups.adminOptions,
    },
  },
  canonicalCollection: {
    graphql: {
      type: "Collection",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        if (!sequence.canonicalCollectionSlug) return null;
        const collection = await context.Collections.findOne({
          slug: sequence.canonicalCollectionSlug,
        });
        return await accessFilterSingle(context.currentUser, "Collections", collection, context);
      },
    },
    form: {
      hidden: true,
    },
  },
  hidden: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      tooltip:
        "Hidden sequences don't show up on lists/search results on this site, but can still be accessed directly by anyone",
      group: () => formGroups.adminOptions,
    },
  },
  noindex: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  postsCount: {
    graphql: {
      type: "Int!",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        const count = await getWithCustomLoader(context, "sequencePostsCount", sequence._id, (sequenceIds) => {
          return context.repos.sequences.postsCount(sequenceIds);
        });
        return count;
      },
    },
  },
  readPostsCount: {
    graphql: {
      type: "Int!",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        const currentUser = context.currentUser;
        if (!currentUser) return 0;
        const createCompositeId = (sequenceId, userId) => `${sequenceId}-${userId}`;
        const splitCompositeId = (compositeId) => {
          const [sequenceId, userId] = compositeId.split("-");
          return {
            sequenceId,
            userId,
          };
        };
        const count = await getWithCustomLoader(
          context,
          "sequenceReadPostsCount",
          createCompositeId(sequence._id, currentUser._id),
          (compositeIds) => {
            return context.repos.sequences.readPostsCount(compositeIds.map(splitCompositeId));
          }
        );
        return count;
      },
    },
  },
  chaptersDummy: {
    graphql: {
      type: "[Chapter]",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        const chapters = await context.Chapters.find(
          {
            sequenceId: sequence._id,
          },
          {
            sort: {
              number: 1,
            },
          }
        ).fetch();
        return await accessFilterMultiple(context.currentUser, "Chapters", chapters, context);
      },
    },
  },
  af: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["alignmentVoters"],
      canCreate: ["alignmentVoters"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
    form: {
      label: "Alignment Forum",
    },
  },
};

export default schema;
