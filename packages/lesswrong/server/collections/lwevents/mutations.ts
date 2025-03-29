
import schema from "@/lib/collections/lWEvents/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

// Collection has custom newCheck

// Collection has custom editCheck

const { createFunction, updateFunction } = getDefaultMutationFunctions('LWEvents', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('LWEvents', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    // ****************************************************
    // TODO: add missing newSync callbacks here!!!
    // ****************************************************

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'LWEvents', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'LWEvents',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    // ****************************************************
    // TODO: add missing createAsync callbacks here!!!
    // ****************************************************

    // ****************************************************
    // TODO: add missing newAsync callbacks here!!!
    // ****************************************************

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'LWEvents', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, LWEvents } = context;

    const {
      documentSelector: lweventSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('LWEvents', { selector, context, data, editCheck, schema });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, LWEvents, lweventSelector, context) ?? previewDocument as DbLWEvent;

    await runCountOfReferenceCallbacks({
      collectionName: 'LWEvents',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'LWEvents', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createLWEvent, updateFunction as updateLWEvent };


export const graphqlLWEventTypeDefs = gql`
  input CreateLWEventInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateLWEventInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createLWEvent(input: CreateLWEventInput!): LWEvent
    updateLWEvent(input: UpdateLWEventInput!): LWEvent
  }
`;
