
import schema from "@/lib/collections/chapters/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { canonizeChapterPostInfo, notifyUsersOfNewPosts, updateSequenceLastUpdated } from "@/server/callbacks/chapterCallbacks";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

async function newCheck(user: DbUser|null, document: DbChapter|null, context: ResolverContext) {
  const { Sequences } = context;
  if (!user || !document) return false;
  let parentSequence = await Sequences.findOne({_id: document.sequenceId});
  if (!parentSequence) return false
  return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.new.own') : userCanDo(user, `chapters.new.all`)
}

async function editCheck(user: DbUser|null, document: DbChapter|null, context: ResolverContext) {
  const { Sequences } = context;
  if (!user || !document) return false;
  let parentSequence = await Sequences.findOne({_id: document.sequenceId});
  if (!parentSequence) return false
  return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.edit.own') : userCanDo(user, `chapters.edit.all`)
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('Chapters', {
  createFunction: async ({ data }: CreateChapterInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Chapters', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await createInitialRevisionsForEditableFields({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Chapters', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await updateRevisionsDocumentIds({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Chapters',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    await canonizeChapterPostInfo(documentWithId, context);

    await uploadImagesInEditableFields({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateChapterInput, context, skipValidation?: boolean) => {
    const { currentUser, Chapters } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: chapterSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Chapters', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let updatedDocument = await updateAndReturnDocument(data, Chapters, chapterSelector, context);

    updatedDocument = await notifyUsersOfNewPingbackMentions({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Chapters',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await updateSequenceLastUpdated(updateCallbackProperties);
    await notifyUsersOfNewPosts(updateCallbackProperties);

    await canonizeChapterPostInfo(updatedDocument, context);

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: Chapters, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createChapterGqlMutation = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Chapters', rawResult, context)
});

export const updateChapterGqlMutation = makeGqlUpdateMutation('Chapters', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Chapters', rawResult, context)
});


export { createFunction as createChapter, updateFunction as updateChapter };


export const graphqlChapterTypeDefs = gql`
  input CreateChapterDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateChapterInput {
    data: CreateChapterDataInput!
  }
  
  input UpdateChapterDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateChapterInput {
    selector: SelectorInput!
    data: UpdateChapterDataInput!
  }
  
  type ChapterOutput {
    data: Chapter
  }

  extend type Mutation {
    createChapter(data: CreateChapterDataInput!): ChapterOutput
    updateChapter(selector: SelectorInput!, data: UpdateChapterDataInput!): ChapterOutput
  }
`;
