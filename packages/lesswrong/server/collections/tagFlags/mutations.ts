
import schema from "@/lib/collections/tagFlags/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: DbTagFlag | null) {
  if (!user || !document) return false;
  return userCanDo(user, `tagFlags.new`)
}

function editCheck(user: DbUser | null, document: DbTagFlag | null) {
  if (!user || !document) return false;
  return userCanDo(user, `tagFlags.edit.all`)
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('TagFlags', {
  createFunction: async ({ data }: CreateTagFlagInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('TagFlags', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runSlugCreateBeforeCallback(callbackProps);

    data = await createInitialRevisionsForEditableFields({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'TagFlags', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await updateRevisionsDocumentIds({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'TagFlags',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    await uploadImagesInEditableFields({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateTagFlagInput, context) => {
    const { currentUser, TagFlags } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: tagflagSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('TagFlags', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let updatedDocument = await updateAndReturnDocument(data, TagFlags, tagflagSelector, context);

    updatedDocument = await notifyUsersOfNewPingbackMentions({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'TagFlags',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: TagFlags, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createTagFlagGqlMutation = makeGqlCreateMutation('TagFlags', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'TagFlags', rawResult, context)
});

export const updateTagFlagGqlMutation = makeGqlUpdateMutation('TagFlags', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'TagFlags', rawResult, context)
});


export { createFunction as createTagFlag, updateFunction as updateTagFlag };


export const graphqlTagFlagTypeDefs = gql`
  input CreateTagFlagDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateTagFlagInput {
    data: CreateTagFlagDataInput!
  }
  
  input UpdateTagFlagDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateTagFlagInput {
    selector: SelectorInput!
    data: UpdateTagFlagDataInput!
  }
  
  type TagFlagOutput {
    data: TagFlag
  }

  extend type Mutation {
    createTagFlag(data: CreateTagFlagDataInput!): TagFlagOutput
    updateTagFlag(selector: SelectorInput!, data: UpdateTagFlagDataInput!): TagFlagOutput
  }
`;
