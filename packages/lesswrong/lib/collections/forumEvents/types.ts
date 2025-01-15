import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import SimpleSchema from 'simpl-schema';

export const EVENT_FORMATS = ["BASIC", "POLL", "STICKERS"] as const;
export const EVENT_FORMATS_SET = new TupleSet(EVENT_FORMATS)
export type ForumEventFormat = UnionOf<typeof EVENT_FORMATS_SET>

export type ForumEventStickerInput = {
  _id: string;
  x: number;
  y: number;
  theta: number;
  emoji: string;
}

export type ForumEventSticker = ForumEventStickerInput & {
  commentId: string;
  userId: string;
}

export type NewForumEventStickerData = {
  format: "STICKERS_1.0", // TODO maybe set this in the db
  data: ForumEventSticker[]
}

// Should match ForumEventCommentMetadataSchema
export type ForumEventCommentMetadata = {
  eventFormat: ForumEventFormat
  sticker?: Partial<ForumEventStickerInput>
}

// Should match ForumEventCommentMetadata
// Note: If this becomes too hard to maintain I think it would be reasonable to switch to a json blob here (but keep the above type)
export const ForumEventCommentMetadataSchema = new SimpleSchema({
  eventFormat: {
    type: String,
    allowedValues: EVENT_FORMATS.slice(),
  },
  sticker: {
    type: new SimpleSchema({
      _id: {
        type: String,
        optional: true,
      },
      x: {
        type: Number,
        optional: true,
      },
      y: {
        type: Number,
        optional: true,
      },
      theta: {
        type: Number,
        optional: true,
      },
      emoji: {
        type: String,
        optional: true,
      }
    }),
    optional: true,
  },
});

