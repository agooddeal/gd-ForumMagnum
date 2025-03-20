import { encodeIntlError} from '../../lib/vulcan-lib/utils';
import { userCanModerateComment } from "../../lib/collections/users/helpers";
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { updateMutator } from '../vulcan-lib/mutators';
import { Comments } from '../../server/collections/comments/collection';
import CommentsRepo from '../repos/CommentsRepo';
import { createPaginatedResolver } from './paginatedResolver';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { isLWorAF } from '../../lib/instanceSettings';
import { fetchFragmentSingle } from '../fetchFragment';
import gql from 'graphql-tag';

const { Query: commentsWithReactsQuery, typeDefs: commentsWithReactsTypeDefs } = createPaginatedResolver({
  name: "CommentsWithReacts",
  graphQLType: "Comment",
  callback: async (context: ResolverContext, limit: number): Promise<DbComment[]> => {
    const commentsRepo = new CommentsRepo()
    const commentsWithReacts = await commentsRepo.getCommentsWithReacts(limit);
    return filterNonnull(commentsWithReacts);
  }
})

const { Query: popularCommentsQuery, typeDefs: popularCommentsTypeDefs } = createPaginatedResolver({
  name: "PopularComments",
  graphQLType: "Comment",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbComment[]> => {
    const recencyFactor = isLWorAF ? 175_000 : 250_000;
    return context.repos.comments.getPopularComments({limit, recencyFactor});
  },
  cacheMaxAgeMs: 300000, // 5 mins
});


export const graphqlMutations = {
  async moderateComment(root: void, { commentId, deleted, deletedPublic, deletedReason}: {
    commentId: string, deleted: boolean, deletedPublic: boolean, deletedReason: string
  }, context: ResolverContext) {
    const {currentUser} = context;
    const comment = await context.Comments.findOne(commentId)
    if (!comment) throw new Error("Invalid commentId");
    const post = comment.postId ? await context.Posts.findOne(comment.postId) : null;
    const tag = comment.tagId ? await context.Tags.findOne(comment.tagId) : null;
    
    if (currentUser && userCanModerateComment(currentUser, post, tag, comment))
    {
      let set: Record<string,any> = {deleted: deleted}
      if (deleted) {
        if(deletedPublic !== undefined) {
          set.deletedPublic = deletedPublic;
        }
        set.deletedDate = comment.deletedDate || new Date();
        if(deletedReason !== undefined) {
          set.deletedReason = deletedReason;
        }
        set.deletedByUserId = currentUser._id;
      } else { //When you undo delete, reset all delete-related fields
        set.deletedPublic = false;
        set.deletedDate = null;
        set.deletedReason = "";
        set.deletedByUserId = null;
      }
      
      const {data: updatedComment} = await updateMutator({
        collection: Comments,
        documentId: commentId,
        set,
        currentUser: currentUser,
        validate: false,
        context
      });
      return await accessFilterSingle(context.currentUser, 'Comments', updatedComment, context);
    } else {
      throw new Error(encodeIntlError({id: `app.user_cannot_moderate_post`}));
    }
  }
}

export const graphqlQueries = {
  ...commentsWithReactsQuery,
  ...popularCommentsQuery
}

export const graphqlTypeDefs = gql`
  extend type Mutation {
    moderateComment(commentId: String, deleted: Boolean, deletedPublic: Boolean, deletedReason: String): Comment
  }
  ${commentsWithReactsTypeDefs}
  ${popularCommentsTypeDefs}
`


type TopicRecommendation = {
  comment: DbComment,
  yourVote?: string,
  theirVote?: string,
  recommendationReason: string
}

export const commentResolvers = {
  postVersion: {
    onCreate: async ({newDocument}) => {
      if (!newDocument.postId) {
        return "1.0.0";
      }
      const post = await fetchFragmentSingle({
        collectionName: "Posts",
        fragmentName: "PostsRevision",
        currentUser: null,
        selector: {_id: newDocument.postId},
      });
      return (post && post.contents && post.contents.version) || "1.0.0";
    },
  },
  promotedByUserId: {
    onUpdate: async ({data, currentUser, document, oldDocument, context}: {
      data: Partial<DbComment>,
      currentUser: DbUser|null,
      document: DbComment,
      oldDocument: DbComment,
      context: ResolverContext,
    }) => {
      if (data?.promoted && !oldDocument.promoted && document.postId) {
        void updateMutator({
          collection: context.Posts,
          context,
          documentId: document.postId,
          data: { lastCommentPromotedAt: new Date() },
          currentUser,
          validate: false
        })
        return currentUser!._id
      }
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"Comments">>;
