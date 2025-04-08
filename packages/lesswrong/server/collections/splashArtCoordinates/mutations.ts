
import schema from "@/lib/collections/splashArtCoordinates/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

function newCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('SplashArtCoordinates', {
  createFunction: async ({ data }: CreateSplashArtCoordinateInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('SplashArtCoordinates', {
      context,
      data,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'SplashArtCoordinates', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await updateCountOfReferencesOnOtherCollectionsAfterCreate('SplashArtCoordinates', documentWithId);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateSplashArtCoordinateInput, context) => {
    const { currentUser, SplashArtCoordinates } = context;

    const {
      documentSelector: splashartcoordinateSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('SplashArtCoordinates', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, SplashArtCoordinates, splashartcoordinateSelector, context);

    await updateCountOfReferencesOnOtherCollectionsAfterUpdate('SplashArtCoordinates', updatedDocument, updateCallbackProperties.oldDocument);

    return updatedDocument;
  },
});

export const createSplashArtCoordinateGqlMutation = makeGqlCreateMutation('SplashArtCoordinates', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SplashArtCoordinates', rawResult, context)
});

export const updateSplashArtCoordinateGqlMutation = makeGqlUpdateMutation('SplashArtCoordinates', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SplashArtCoordinates', rawResult, context)
});


export { createFunction as createSplashArtCoordinate, updateFunction as updateSplashArtCoordinate };


export const graphqlSplashArtCoordinateTypeDefs = gql`
  input CreateSplashArtCoordinateDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateSplashArtCoordinateInput {
    data: CreateSplashArtCoordinateDataInput!
  }
  
  input UpdateSplashArtCoordinateDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateSplashArtCoordinateInput {
    selector: SelectorInput!
    data: UpdateSplashArtCoordinateDataInput!
  }
  
  type SplashArtCoordinateOutput {
    data: SplashArtCoordinate
  }

  extend type Mutation {
    createSplashArtCoordinate(data: CreateSplashArtCoordinateDataInput!): SplashArtCoordinateOutput
    updateSplashArtCoordinate(selector: SelectorInput!, data: UpdateSplashArtCoordinateDataInput!): SplashArtCoordinateOutput
  }
`;
