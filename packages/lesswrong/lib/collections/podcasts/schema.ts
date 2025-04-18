import { universalFields } from "@/lib/collectionUtils";

const schema: SchemaType<"Podcasts"> = {
  ...universalFields({}),

  title: {
    type: String,
    optional: false,
    canRead: ['guests']
  },
  applePodcastLink: {
    type: String,
    optional: true,
    canRead: ['guests'],
    nullable: true
  },
  spotifyPodcastLink: {
    type: String,
    optional: true,
    canRead: ['guests'],
    nullable: true
  }
};

export default schema;
