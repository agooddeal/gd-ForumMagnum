import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const SplashArtCoordinates: SplashArtCoordinatesCollection = createCollection({ 
  collectionName: 'SplashArtCoordinates',
  typeName: 'SplashArtCoordinate',
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('SplashArtCoordinates', { reviewWinnerArtId: 1, createdAt: 1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('SplashArtCoordinates'),
});


export default SplashArtCoordinates;
