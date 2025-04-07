import schema from "@/lib/collections/tags/newSchema";
import { isElasticEnabled } from "@/lib/instanceSettings";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { cascadeSoftDeleteToTagRels, reexportProfileTagUsersToElastic, updateParentTagSubTagIds, validateTagCreate, validateTagUpdate } from "@/server/callbacks/tagCallbackFunctions";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds, notifyUsersOfPingbackMentions } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";
import { newCheck, editCheck } from "./helpers";

const { createFunction, updateFunction } = getDefaultMutationFunctions('Tags', {
  createFunction: async ({ data }: CreateTagInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Tags', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    if (!skipValidation) {
      await validateTagCreate(callbackProps);
    }

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runSlugCreateBeforeCallback(callbackProps);

    data = await createInitialRevisionsForEditableFields({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Tags', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await updateRevisionsDocumentIds({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    documentWithId = await notifyUsersOfPingbackMentions({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Tags',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    if (isElasticEnabled) {
      void elasticSyncDocument('Tags', documentWithId._id);
    }

    await uploadImagesInEditableFields({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateTagInput, context, skipValidation?: boolean) => {
    const { currentUser, Tags } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: tagSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Tags', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    if (!skipValidation) {
      await validateTagUpdate(updateCallbackProperties);
    }

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let updatedDocument = await updateAndReturnDocument(data, Tags, tagSelector, context);

    updatedDocument = await cascadeSoftDeleteToTagRels(updatedDocument, updateCallbackProperties);
    updatedDocument = await updateParentTagSubTagIds(updatedDocument, updateCallbackProperties);
    updatedDocument = await reexportProfileTagUsersToElastic(updatedDocument, updateCallbackProperties);

    updatedDocument = await notifyUsersOfNewPingbackMentions({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Tags',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    if (isElasticEnabled) {
      void elasticSyncDocument('Tags', updatedDocument._id);
    }

    void logFieldChanges({ currentUser, collection: Tags, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Tags', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('Tags', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Tags', rawResult, context)
});


export { createFunction as createTag, updateFunction as updateTag };
export { wrappedCreateFunction as createTagMutation, wrappedUpdateFunction as updateTagMutation };


export const graphqlTagTypeDefs = gql`
  input CreateTagDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateTagInput {
    data: CreateTagDataInput!
  }
  
  input UpdateTagDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateTagInput {
    selector: SelectorInput!
    data: UpdateTagDataInput!
  }
  
  type TagOutput {
    data: Tag
  }

  extend type Mutation {
    createTag(data: CreateTagDataInput!): TagOutput
    updateTag(selector: SelectorInput!, data: UpdateTagDataInput!): TagOutput
  }
`;
