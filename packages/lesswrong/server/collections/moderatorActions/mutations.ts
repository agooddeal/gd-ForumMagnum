
import schema from "@/lib/collections/moderatorActions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { triggerReviewAfterModeration } from "@/server/callbacks/moderatorActionCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateModeratorActionDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbModeratorAction | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('ModeratorActions', {
  createFunction: async ({ data }: CreateModeratorActionInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('ModeratorActions', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ModeratorActions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ModeratorActions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    await triggerReviewAfterModeration(asyncProperties);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateModeratorActionInput, context) => {
    const { currentUser, ModeratorActions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: moderatoractionSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('ModeratorActions', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, ModeratorActions, moderatoractionSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'ModeratorActions',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: ModeratorActions, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createModeratorActionGqlMutation = makeGqlCreateMutation('ModeratorActions', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModeratorActions', rawResult, context)
});

export const updateModeratorActionGqlMutation = makeGqlUpdateMutation('ModeratorActions', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ModeratorActions', rawResult, context)
});


export { createFunction as createModeratorAction, updateFunction as updateModeratorAction };


export const graphqlModeratorActionTypeDefs = gql`
  input CreateModeratorActionDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateModeratorActionInput {
    data: CreateModeratorActionDataInput!
  }
  
  input UpdateModeratorActionDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateModeratorActionInput {
    selector: SelectorInput!
    data: UpdateModeratorActionDataInput!
  }
  
  type ModeratorActionOutput {
    data: ModeratorAction
  }

  extend type Mutation {
    createModeratorAction(data: CreateModeratorActionDataInput!): ModeratorActionOutput
    updateModeratorAction(selector: SelectorInput!, data: UpdateModeratorActionDataInput!): ModeratorActionOutput
  }
`;
