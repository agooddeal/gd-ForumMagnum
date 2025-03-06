import { createCollection } from '../../vulcan-lib/collections';
import { addUniversalFields } from "../../collectionUtils";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';
import schema from './schema';

/**
 * Cache for link-previews of Arbital links.
 */
export const ArbitalCaches: ArbitalCachesCollection = createCollection({
  collectionName: 'ArbitalCaches',
  typeName: 'ArbitalCaches',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ArbitalCaches', { pageAlias: 1 })
    indexSet.addIndex('ArbitalCaches', { fetchedAt: 1 })
    return indexSet;
  },
  logChanges: true,
});

addUniversalFields({collection: ArbitalCaches})

export default ArbitalCaches;
