
import schema from "@/lib/collections/podcastEpisodes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getCreatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

function newCheck(user: DbUser | null) {
  return userIsAdmin(user) || userIsPodcaster(user);
}

export async function createPodcastEpisode({ data }: CreatePodcastEpisodeInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('PodcastEpisodes', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PodcastEpisodes', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('PodcastEpisodes', documentWithId);

  return documentWithId;
}

export async function updatePodcastEpisode({ selector, data }: UpdatePodcastEpisodeInput, context: ResolverContext) {
  const { currentUser, PodcastEpisodes } = context;

  const {
    documentSelector: podcastepisodeSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('PodcastEpisodes', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, PodcastEpisodes, podcastepisodeSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('PodcastEpisodes', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}

export const createPodcastEpisodeGqlMutation = makeGqlCreateMutation('PodcastEpisodes', createPodcastEpisode, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PodcastEpisodes', rawResult, context)
});



export const graphqlPodcastEpisodeTypeDefs = gql`
  input CreatePodcastEpisodeDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreatePodcastEpisodeInput {
    data: CreatePodcastEpisodeDataInput!
  }
  
  type PodcastEpisodeOutput {
    data: PodcastEpisode
  }

  extend type Mutation {
    createPodcastEpisode(data: CreatePodcastEpisodeDataInput!): PodcastEpisodeOutput
  }
`;
