import { Globals } from "@/lib/vulcan-lib/config";
import { forEachDocumentInCollection } from "../manualMigrations/migrationUtils";
import { Users } from "@/lib/collections/users/collection";
import { Revisions } from "@/lib/collections/revisions/collection";
import Tags from "@/lib/collections/tags/collection";
import { createMutator, updateMutator } from "@/server/vulcan-lib/mutators";
import { afterCreateRevisionCallback, buildRevision } from "../editor/make_editable_callbacks";
import { dataToCkEditor } from "../editor/conversionUtils";
import { parseSemver } from "@/lib/editor/utils";
import { updateDenormalizedHtmlAttributions } from "../tagging/updateDenormalizedHtmlAttributions";

Globals.convertTagsToCkEditor = async (conversionUserSlug?: string) => {
  const conversionUser = await Users.findOne({ slug: conversionUserSlug ?? "lesswrong-internal" });
  if (!conversionUser) {
    console.error(`You must provide a conversion account, which will own any revisions which are created for format conversion.`);
    return;
  }
  
  await forEachDocumentInCollection({
    collection: Tags,
    filter: {
      deleted: false,
    },
    callback: async (tag: DbTag) => {
      await convertTagToCkEditor(tag, conversionUser);
    }
  });
}

async function convertTagToCkEditor(tag: DbTag, conversionUser: DbUser) {
  if (tag.description?.originalContents?.type === 'draftJS') {
    const [oldMajor,oldMinor,oldPatch] = parseSemver(tag.description.version);
    const newVersion = `${oldMajor}.${oldMinor}.${oldPatch+1}`;

    await updateMutator({
      collection: Tags,
      documentId: tag._id,
      currentUser: conversionUser,
      set: {
        description: {
          originalContents: {
            type: "ckEditorMarkup",
            data: await dataToCkEditor(tag.description.originalContents.data, tag.description.originalContents.type),
          },
          commitMessage: "Convert editor type to CkEditor",
        },
      },
      validate: false,
    });
  }
}
