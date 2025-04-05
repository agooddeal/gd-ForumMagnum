
import schema from "@/lib/collections/postViews/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreatePostViewsDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbPostViews | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('PostViews', {
  createFunction: async ({ data }: CreatePostViewsInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('PostViews', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PostViews', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'PostViews',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdatePostViewsInput, context, skipValidation?: boolean) => {
    const { currentUser, PostViews } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: postviewsSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('PostViews', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, PostViews, postviewsSelector, context) ?? previewDocument as DbPostViews;

    await runCountOfReferenceCallbacks({
      collectionName: 'PostViews',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: PostViews, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViews', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('PostViews', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PostViews', rawResult, context)
});


export { createFunction as createPostViews, updateFunction as updatePostViews };
export { wrappedCreateFunction as createPostViewsMutation, wrappedUpdateFunction as updatePostViewsMutation };


export const graphqlPostViewsTypeDefs = gql`
  input CreatePostViewsDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreatePostViewsInput {
    data: CreatePostViewsDataInput!
  }
  
  input UpdatePostViewsDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdatePostViewsInput {
    selector: SelectorInput!
    data: UpdatePostViewsDataInput!
  }
  
  extend type Mutation {
    createPostViews(input: CreatePostViewsInput!): PostViews
    updatePostViews(selector: SelectorInput!, data: UpdatePostViewsDataInput!): PostViews
  }
`;
