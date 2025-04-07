
import schema from "@/lib/collections/llmConversations/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function editCheck(user: DbUser | null, document: DbLlmConversation | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('LlmConversations', {
  createFunction: async ({ data }: { data: Partial<DbLlmConversation> }, context, skipValidation?: boolean) => {
    const callbackProps = await checkCreatePermissionsAndReturnProps('LlmConversations', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'LlmConversations', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'LlmConversations',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateLlmConversationInput, context, skipValidation?: boolean) => {
    const { currentUser, LlmConversations } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: llmconversationSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('LlmConversations', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, LlmConversations, llmconversationSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'LlmConversations',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: LlmConversations, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedUpdateFunction = makeGqlUpdateMutation('LlmConversations', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'LlmConversations', rawResult, context)
});


export { createFunction as createLlmConversation, updateFunction as updateLlmConversation };
export { wrappedUpdateFunction as updateLlmConversationMutation };


export const graphqlLlmConversationTypeDefs = gql`
  input UpdateLlmConversationDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateLlmConversationInput {
    selector: SelectorInput!
    data: UpdateLlmConversationDataInput!
  }

  type LlmConversationOutput {
    data: LlmConversation
  }
  
  extend type Mutation {
    updateLlmConversation(selector: SelectorInput!, data: UpdateLlmConversationDataInput!): LlmConversationOutput
  }
`;
