
import schema from "@/lib/collections/userMostValuablePosts/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateUserMostValuablePostDataInput | null, context: ResolverContext) {
  return userCanDo(user, [
    'usermostvaluablepost.create',
    'usermostvaluableposts.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbUserMostValuablePost | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'usermostvaluablepost.update.own',
      'usermostvaluableposts.edit.own',
    ])
    : userCanDo(user, [
      'usermostvaluablepost.update.all',
      'usermostvaluableposts.edit.all',
    ]);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('UserMostValuablePosts', {
  createFunction: async ({ data }: CreateUserMostValuablePostInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('UserMostValuablePosts', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'UserMostValuablePosts', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserMostValuablePosts',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateUserMostValuablePostInput, context, skipValidation?: boolean) => {
    const { currentUser, UserMostValuablePosts } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: usermostvaluablepostSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('UserMostValuablePosts', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, UserMostValuablePosts, usermostvaluablepostSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'UserMostValuablePosts',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: UserMostValuablePosts, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserMostValuablePosts', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('UserMostValuablePosts', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserMostValuablePosts', rawResult, context)
});


export { createFunction as createUserMostValuablePost, updateFunction as updateUserMostValuablePost };
export { wrappedCreateFunction as createUserMostValuablePostMutation, wrappedUpdateFunction as updateUserMostValuablePostMutation };


export const graphqlUserMostValuablePostTypeDefs = gql`
  input CreateUserMostValuablePostDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateUserMostValuablePostInput {
    data: CreateUserMostValuablePostDataInput!
  }
  
  input UpdateUserMostValuablePostDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateUserMostValuablePostInput {
    selector: SelectorInput!
    data: UpdateUserMostValuablePostDataInput!
  }
  
  type UserMostValuablePostOutput {
    data: UserMostValuablePost
  }

  extend type Mutation {
    createUserMostValuablePost(data: CreateUserMostValuablePostDataInput!): UserMostValuablePostOutput
    updateUserMostValuablePost(selector: SelectorInput!, data: UpdateUserMostValuablePostDataInput!): UserMostValuablePostOutput
  }
`;
