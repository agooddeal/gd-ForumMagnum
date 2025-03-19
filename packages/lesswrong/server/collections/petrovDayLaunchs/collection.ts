import schema from '@/lib/collections/petrovDayLaunchs/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';

export const PetrovDayLaunchs: PetrovDayLaunchsCollection = createCollection({
  collectionName: 'PetrovDayLaunchs',
  typeName: 'PetrovDayLaunch',
  schema
});


export default PetrovDayLaunchs;
