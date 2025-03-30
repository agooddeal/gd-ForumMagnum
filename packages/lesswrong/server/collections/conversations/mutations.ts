
import { userCanStartConversations } from "@/lib/collections/conversations/helpers";
import schema from "@/lib/collections/conversations/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { conversationEditNotification, flagOrBlockUserOnManyDMs, sendUserLeavingConversationNotication } from "@/server/callbacks/conversationCallbacks";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

function newCheck(user: DbUser | null, document: DbConversation | null) {
  if (!user || !document) return false;
  if (!userCanStartConversations(user)) return false
  return document.participantIds.includes(user._id) ? userCanDo(user, 'conversations.new.own')
   : userCanDo(user, `conversations.new.all`)
}

function editCheck(user: DbUser | null, document: DbConversation | null) {
  if (!user || !document) return false;
  return document.participantIds.includes(user._id) ? userCanDo(user, 'conversations.edit.own')
  : userCanDo(user, `conversations.edit.all`)
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Conversations', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Conversations', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    await flagOrBlockUserOnManyDMs({ currentConversation: data, currentUser, context });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Conversations', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Conversations',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Conversations', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }, context) => {
    const { currentUser, Conversations } = context;

    const {
      documentSelector: conversationSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Conversations', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    await flagOrBlockUserOnManyDMs({ currentConversation: data, oldConversation: oldDocument, currentUser, context });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Conversations, conversationSelector, context) ?? previewDocument as DbConversation;

    await runCountOfReferenceCallbacks({
      collectionName: 'Conversations',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await sendUserLeavingConversationNotication(updateCallbackProperties);

    await conversationEditNotification(updatedDocument, oldDocument, currentUser, context);

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Conversations', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createConversation, updateFunction as updateConversation };


export const graphqlConversationTypeDefs = gql`
  input CreateConversationInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateConversationInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createConversation(input: CreateConversationInput!): Conversation
    updateConversation(input: UpdateConversationInput!): Conversation
  }
`;
