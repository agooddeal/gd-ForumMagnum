import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const Podcasts: PodcastsCollection = createCollection({
  collectionName: 'Podcasts',
  typeName: 'Podcast',
  schema,
  resolvers: getDefaultResolvers('Podcasts')
});

addUniversalFields({ collection: Podcasts });

export default Podcasts;
