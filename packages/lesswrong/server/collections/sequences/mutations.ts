
import schema from "@/lib/collections/sequences/newSchema";
import { isElasticEnabled } from "@/lib/instanceSettings";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userOwns, userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { createFirstChapter } from "@/server/callbacks/sequenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: DbSequence | null) {
  if (!user || !document) return false;
  // Either the document is unowned (and will be filled in with the userId
  // later), or the user owns the document, or the user is an admin
  return (!document.userId || userOwns(user, document)) ?
    userCanDo(user, 'sequences.new.own') :
    userCanDo(user, `sequences.new.all`)
}

function editCheck(user: DbUser | null, document: DbSequence | null) {
  if (!user || !document) return false;
  return userOwns(user, document)
    ? userCanDo(user, 'sequences.edit.own')
    : userCanDo(user, `sequences.edit.all`)
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('Sequences', {
  createFunction: async ({ data }: CreateSequenceInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Sequences', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await createInitialRevisionsForEditableFields({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Sequences', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await updateRevisionsDocumentIds({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Sequences',
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
      void elasticSyncDocument('Sequences', documentWithId._id);
    }

    createFirstChapter(documentWithId, context);

    await uploadImagesInEditableFields({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateSequenceInput, context, skipValidation?: boolean) => {
    const { currentUser, Sequences } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: sequenceSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Sequences', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let updatedDocument = await updateAndReturnDocument(data, Sequences, sequenceSelector, context);

    updatedDocument = await notifyUsersOfNewPingbackMentions({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Sequences',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    if (isElasticEnabled) {
      void elasticSyncDocument('Sequences', updatedDocument._id);
    }

    void logFieldChanges({ currentUser, collection: Sequences, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Sequences', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('Sequences', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Sequences', rawResult, context)
});


export { createFunction as createSequence, updateFunction as updateSequence };
export { wrappedCreateFunction as createSequenceMutation, wrappedUpdateFunction as updateSequenceMutation };


export const graphqlSequenceTypeDefs = gql`
  input CreateSequenceDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateSequenceInput {
    data: CreateSequenceDataInput!
  }
  
  input UpdateSequenceDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateSequenceInput {
    selector: SelectorInput!
    data: UpdateSequenceDataInput!
  }
  
  type SequenceOutput {
    data: Sequence
  }

  extend type Mutation {
    createSequence(data: CreateSequenceDataInput!): SequenceOutput
    updateSequence(selector: SelectorInput!, data: UpdateSequenceDataInput!): SequenceOutput
  }
`;
