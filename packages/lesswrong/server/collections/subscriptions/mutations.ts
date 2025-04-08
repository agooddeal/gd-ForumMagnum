
import schema from "@/lib/collections/subscriptions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { deleteOldSubscriptions } from "@/server/callbacks/subscriptionCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import { clone } from "underscore";

function newCheck(user: DbUser | null, document: CreateSubscriptionDataInput | null) {
  if (!user || !document) return false;
  return userCanDo(user, 'subscriptions.new');
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Subscriptions', {
  createFunction: async ({ data }: CreateSubscriptionInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('Subscriptions', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    await deleteOldSubscriptions(data, context);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Subscriptions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await updateCountOfReferencesOnOtherCollectionsAfterCreate('Subscriptions', documentWithId);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: Partial<DbSubscription> }, context) => {
    const { currentUser, Subscriptions } = context;

    const {
      documentSelector: subscriptionSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('Subscriptions', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, Subscriptions, subscriptionSelector, context);

    await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Subscriptions', updatedDocument, updateCallbackProperties.oldDocument);

    return updatedDocument;
  },
});

export const createSubscriptionGqlMutation = makeGqlCreateMutation('Subscriptions', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Subscriptions', rawResult, context)
});


export { createFunction as createSubscription, updateFunction as updateSubscription };


export const graphqlSubscriptionTypeDefs = gql`
  input CreateSubscriptionDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateSubscriptionInput {
    data: CreateSubscriptionDataInput!
  }
  
  type SubscriptionOutput {
    data: Subscription
  }
  
  extend type Mutation {
    createSubscription(data: CreateSubscriptionDataInput!): SubscriptionOutput
  }
`;
