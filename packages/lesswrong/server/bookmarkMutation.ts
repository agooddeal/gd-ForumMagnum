import Users from '../server/collections/users/collection';
import { accessFilterSingle } from '../lib/utils/schemaUtils';
import { updateMutator } from './vulcan-lib/mutators';
import * as _ from 'underscore';
import gql from 'graphql-tag';

export const bookmarkGqlTypeDefs = gql`
  extend type Mutation {
    setIsBookmarked(postId: String!, isBookmarked: Boolean!): User!
  }
`
export const bookmarkGqlMutations = {
  async setIsBookmarked(root: void, {postId,isBookmarked}: {postId: string, isBookmarked: boolean}, context: ResolverContext): Promise<Partial<DbUser>> {
    const {currentUser} = context;
    if (!currentUser)
      throw new Error("Log in to use bookmarks");
    
    const oldBookmarksList = currentUser.bookmarkedPostsMetadata;
    const alreadyBookmarked = _.some(oldBookmarksList, bookmark=>bookmark.postId===postId);
    const newBookmarksList = (isBookmarked
      ? (alreadyBookmarked ? oldBookmarksList : [...(oldBookmarksList||[]), {postId}])
      : _.reject(oldBookmarksList, bookmark=>bookmark.postId===postId)
    );
    
    await updateMutator({
      collection: Users,
      documentId: currentUser._id,
      set: {bookmarkedPostsMetadata: newBookmarksList},
      currentUser, context,
      validate: false,
    });
    
    const updatedUser = await Users.findOne(currentUser._id)!;
    return (await accessFilterSingle(currentUser, 'Users', updatedUser, context))!;
  }
}
