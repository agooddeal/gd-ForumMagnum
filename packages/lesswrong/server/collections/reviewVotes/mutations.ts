
import schema from "@/lib/collections/reviewVotes/newSchema";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { ensureUniqueVotes, positiveReviewVoteNotifications } from "@/server/callbacks/reviewVoteCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";

type CreateReviewVoteDataInput = Partial<DbReviewVote>;
type UpdateReviewVoteDataInput = Partial<DbReviewVote>;

const { createFunction, updateFunction } = getDefaultMutationFunctions('ReviewVotes', {
  createFunction: async ({ data }: { data: CreateReviewVoteDataInput }, context, skipValidation?: boolean) => {
    const { currentUser, ReviewVotes } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('ReviewVotes', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    if (!skipValidation) {
      await ensureUniqueVotes(callbackProps);
    }

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ReviewVotes', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ReviewVotes',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    await positiveReviewVoteNotifications(documentWithId, currentUser, ReviewVotes, afterCreateProperties);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: UpdateReviewVoteDataInput }, context, skipValidation?: boolean) => {
    const { currentUser, ReviewVotes } = context;

    const {
      documentSelector: reviewvoteSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('ReviewVotes', { selector, context, data, schema, skipValidation });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, ReviewVotes, reviewvoteSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'ReviewVotes',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});


export { createFunction as createReviewVote, updateFunction as updateReviewVote };

// This doesn't have CRUD mutations, the functions are used purely by `submitReviewVote`.
