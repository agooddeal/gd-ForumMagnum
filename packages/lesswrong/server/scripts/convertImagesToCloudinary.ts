import { Globals } from '../../lib/vulcan-lib/config';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Images } from '../../lib/collections/images/collection';
import { DatabaseServerSetting } from '../databaseSettings';
import { ckEditorUploadUrlSetting, cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { randomId } from '../../lib/random';
import cloudinary, { UploadApiResponse } from 'cloudinary';
import cheerio from 'cheerio';
import { cheerioParse } from '../utils/htmlUtil';
import { URL } from 'url';
import { ckEditorUploadUrlOverrideSetting } from '../../lib/instanceSettings';
import { getCollection } from '../../lib/vulcan-lib/getCollection';
import uniq from 'lodash/uniq';
import { loggerConstructor } from '../../lib/utils/logging';
import { Posts } from '../../lib/collections/posts';
import { getAtPath, setAtPath } from '../../lib/helpers';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import crypto from 'crypto';

const cloudinaryApiKey = new DatabaseServerSetting<string>("cloudinaryApiKey", "");
const cloudinaryApiSecret = new DatabaseServerSetting<string>("cloudinaryApiSecret", "");

type CloudinaryCredentials = {
  cloud_name: string,
  api_key: string,
  api_secret: string,
}

/**
 * Credentials that can be spread into `cloudinary.v2` functions, like so: `cloudinary.v2.url(publicId, { ...credentials })`
 */
const getCloudinaryCredentials = () => {
  const cloudName = cloudinaryCloudNameSetting.get();
  const apiKey = cloudinaryApiKey.get();
  const apiSecret = cloudinaryApiSecret.get();

  if (!cloudName || !apiKey || !apiSecret) {
    // eslint-disable-next-line no-console
    console.error("Cloudinary credentials not configured");
    return null;
  }

  const credentials: CloudinaryCredentials = {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  };
  return credentials;
};

/** If an image has already been re-hosted, return its CDN URL. Otherwise null. */
async function findAlreadyMovedImage(identifier: string): Promise<string|null> {
  const image = await Images.findOne({identifier});
  return image?.cdnHostedUrl ?? null;
}

/**
 * Re-upload the given image URL to cloudinary, and return the cloudinary URL. If the image has already been uploaded
 * it will return the existing cloudinary URL.
 */
export async function moveImageToCloudinary({oldUrl, originDocumentId}: {oldUrl: string, originDocumentId: string}): Promise<string|null> {
  const upload = async (credentials: CloudinaryCredentials) => {
    // eslint-disable-next-line no-console
    console.log(`Uploading ${oldUrl} to Cloudinary`);
    return await cloudinary.v2.uploader.upload(
      oldUrl,
      {
        folder: `mirroredImages/${originDocumentId}`,
        ...credentials
      }
    );
  }

  return getOrCreateCloudinaryImage({identifier: oldUrl, identifierType: 'originalUrl', upload})
}

/**
 * Upload the given image buffer to cloudinary, and return the cloudinary URL. If the image has already been uploaded
 * (identified by SHA256 hash) it will return the existing cloudinary URL.
 */
export async function uploadBufferToCloudinary(buffer: Buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const upload = async (credentials: CloudinaryCredentials) => new Promise<UploadApiResponse>((resolve) => {
    cloudinary.v2.uploader
      .upload_stream(
        {
          ...credentials,
          folder: `mirroredImages/${hash}`
        },
        (error, result) => {
          if (error || !result) {
            // eslint-disable-next-line no-console
            console.error("Failed to upload buffer to Cloudinary:", error);
            throw error;
          }
          return resolve(result);
        }
      )
      .end(buffer);
  })

  return getOrCreateCloudinaryImage({identifier: hash, identifierType: 'sha256Hash', upload})
}

/**
 * Returns a cloudinary url of the image corresponding to `identifier`, uploads the image if it doesn't
 * already exist in cloudinary
 */
async function getOrCreateCloudinaryImage({
  identifier,
  identifierType,
  upload,
}: {
  identifier: string;
  identifierType: string;
  upload: (credentials: CloudinaryCredentials) => Promise<UploadApiResponse>;
}) {
  const logger = loggerConstructor("image-conversion");
  const alreadyRehosted = await findAlreadyMovedImage(identifier);
  if (alreadyRehosted) return alreadyRehosted;

  const credentials = getCloudinaryCredentials();

  if (!credentials) return null;

  const uploadResponse = await upload(credentials);
  logger(`Result of uploading image: ${uploadResponse.secure_url}`);

  // Serve all images with automatic quality and format transformations to save on bandwidth
  const autoQualityFormatUrl = cloudinary.v2.url(uploadResponse.public_id, {
    ...credentials,
    quality: "auto",
    fetch_format: "auto",
    secure: true,
  });

  await Images.rawInsert({
    identifier,
    identifierType,
    cdnHostedUrl: autoQualityFormatUrl,
  });

  return autoQualityFormatUrl;
}

/**
 * Images on domains not in this list will be mirrored on Cloudinary and have
 * their src updated.
 */
function getImageUrlWhitelist() {
  const localUploadUrl = ckEditorUploadUrlOverrideSetting.get() || ckEditorUploadUrlSetting.get()
  return [
    "cloudinary.com",
    "res.cloudinary.com",
    "www.lesswrong.com",
    "www.alignmentforum.org",
  ].concat(localUploadUrl ? [new URL(localUploadUrl).host] : []);
}

function urlNeedsMirroring(url: string, filterFn: (url: string) => boolean) {
  try {
    const parsedUrl = new URL(url);
    if (getImageUrlWhitelist().indexOf(parsedUrl.hostname) !== -1) {
      return false;
    }
    return filterFn(url);
  } catch (e) {
    return false;
  }
}

export async function convertImagesInHTML(html: string, originDocumentId: string, urlFilterFn: (url: string) => boolean = () => true, imageUrlsCache?: Record<string,string>): Promise<{count: number, html: string}> {
  const parsedHtml = cheerioParse(html);
  const imgTags = parsedHtml("img").toArray();
  const imgUrls: string[] = [];
  
  for (let imgTag of imgTags) {
    const urls = getImageUrlsFromImgTag(cheerio(imgTag));
    for (let url of urls) {
      if (urlNeedsMirroring(url, urlFilterFn)) {
        imgUrls.push(url);
      }
    }
  }

  // Upload all the images to Cloudinary (slow)
  const mirrorUrls: Record<string,string> = imageUrlsCache ?? {};
  await Promise.all(imgUrls.map(async (url) => {
    if (url in mirrorUrls) {
      return;
    }
    // resolve to the url of the image on cloudinary
    const movedImage = await moveImageToCloudinary({oldUrl: url, originDocumentId})
    if (movedImage) {
      mirrorUrls[url] = movedImage;
    }
  }));

  // cheerio is not guarantueed to return the same html so explicitly count
  // the number of images that were converted
  let count = 0
  
  for (let i=0; i<imgTags.length; i++) {
    const imgTag = cheerio(imgTags[i]);
    const src: string|undefined = imgTag.attr("src");
    if (src) {
      const replacement = mirrorUrls[src];
      if (replacement) {
        imgTag.attr("src", replacement);
        count++;
      }
    }
    
    const srcset: string|undefined = imgTag.attr("srcset");
    if (srcset) {
      const replacement = rewriteSrcset(srcset, mirrorUrls);
      if (replacement) {
        imgTag.attr("srcset", replacement);
        count++;
      }
    }
  }
  
  return {count, html: parsedHtml.html()};
}

function getImageUrlsFromImgTag(tag: any): string[] {
  let imageUrls: string[] = [];
  const src: string = tag.attr("src");
  if (src) {
    imageUrls.push(src);
  }
  const srcset: string = tag.attr("srcset");
  if (srcset) {
    const imageVariants = srcset.split(/,\s/g).map(tok=>tok.trim());
    for (let imageVariant of imageVariants) {
      const [url, _size] = imageVariant.split(" ").map(tok=>tok.trim());
      if (url) imageUrls.push(url);
    }
  }
  
  return uniq(imageUrls);
}

function rewriteSrcset(srcset: string, urlMap: Record<string,string>): string {
  const imageVariants = srcset.split(/,\s/g).map(tok=>tok.trim());
  const rewrittenImageVariants = imageVariants.map(variant => {
    let tokens = variant.split(" ");
    if (tokens[0] in urlMap)
      tokens[0] = urlMap[tokens[0]];
    return tokens.join(" ");
  });
  return rewrittenImageVariants.join(", ");
}

/**
 * Reupload all images in an object (post, tag, user, etc) to Cloudinary, for a
 * specific editable field. Creates a new revision with the updated HTML.
 *
 * @param collectionName - The collection that this object is in
 * @param _id - The object to reupload images for
 * @param fieldName - The content-editable field tos can for images
 * @param urlFilterFn - A function that takes a URL and returns true if it should be mirrored, by default all URLs are mirrored except those in getImageUrlWhitelist()
 * @returns The number of images that were mirrored
 */
export async function convertImagesInObject<N extends CollectionNameString>(
  collectionName: N,
  _id: string,
  fieldName = "contents",
  urlFilterFn: (url: string) => boolean = ()=>true
): Promise<number> {
  const logger = loggerConstructor("image-conversion")
  let totalUploaded = 0;
  try {
    const collection = getCollection(collectionName);
    const obj = await collection.findOne({_id});

    if (!obj) {
      // eslint-disable-next-line no-console
      console.error(`Cannot convert images in ${collectionName}.${_id}: ID not found`);
      return 0;
    }
    
    const latestRev = await getLatestRev(_id, fieldName);
    if (!latestRev) {
      // If this field doesn't have a latest rev, it's empty (common eg for
      // moderation guidelines).
      return 0;
    }
    
    const newVersion = getNextVersion(latestRev, "patch", false);
    const now = new Date();
    // We also manually downcast the document because it's otherwise a union type of all possible DbObjects, and we can't use a random string as an index accessor
    // This is because `collection` is itself a union of all possible collections
    // I tried to make a mutual constraint between `fieldName` and `collectionName` but it was a bit too finnicky to be worth it; this is mostly being (unsafely) called from Globals anyways
    //
    // TODO: For post contents normalization. Below is the old comment - is this a problem?
    // NOTE: we use the post contents rather than the revision contents because we don't
    // create a revision for no-op edits (this is arguably a bug)
    // const oldHtml = (obj as AnyBecauseHard)?.[fieldName]?.html;
    const oldHtml = latestRev.html;
    if (!oldHtml) {
      return 0;
    }
    const {count: uploadCount, html: newHtml} = await convertImagesInHTML(oldHtml, _id, urlFilterFn);
    if (!uploadCount) {
      logger("No images to convert.");
      return 0;
    } else {
      logger(`Converted ${uploadCount} images`)
    }
    
    const newRevision = {
      ...latestRev,
      _id: randomId(),
      html: newHtml,
      editedAt: now,
      updateType: "patch",
      version: newVersion,
      commitMessage: "Move images to CDN",
      changeMetrics: htmlToChangeMetrics(oldHtml, newHtml),
    };
    const insertedRevisionId: string = await Revisions.rawInsert(newRevision);
    await collection.rawUpdateOne({_id}, {
      $set: {
        [`${fieldName}_latest`]: insertedRevisionId,
        [fieldName]: {
          ...(obj as AnyBecauseHard)[fieldName],
          html: newHtml,
          version: newVersion,
          editedAt: now,
          updateType: "patch",
        },
      }
    });
    totalUploaded += uploadCount;
    return totalUploaded;
  } catch (e) {
    // Always catch the error because the obj should mostly load fine without rehosting the images
    // eslint-disable-next-line no-console
    console.error("Error in convertImagesInObject", e)
    return 0
  }
}

const postMetaImageFields: string[][] = [
  ["socialPreview", "imageId"],
  ["eventImageId"],
  ["socialPreviewImageAutoUrl"],
  ["socialPreviewImageId"],
];

export const rehostPostMetaImages = async (post: DbPost) => {
  const operations: MongoBulkWriteOperations<DbPost> = [];

  for (const field of postMetaImageFields) {
    const currentUrl = getAtPath<DbPost, string>(post, field);
    if (!currentUrl || !urlNeedsMirroring(currentUrl, () => true)) {
      continue;
    }

    let newUrl: string | null = null;
    try {
      newUrl = await moveImageToCloudinary({oldUrl: currentUrl, originDocumentId: post._id});
    } catch (e) {
      // eslint-disable-next-line
      console.error(`Failed to move image for ${post._id}:`, field, `(error ${e})`);
      continue;
    }
    if (!newUrl) {
      // eslint-disable-next-line
      console.error(`Failed to move image for ${post._id}:`, field);
      continue;
    }

    setAtPath(post, field, newUrl);

    operations.push({
      updateOne: {
        filter: {
          _id: post._id,
        },
        update: {
          $set: {
            [field.join(".")]: newUrl,
          },
        },
      },
    });
  }

  await Posts.rawCollection().bulkWrite(operations);
}

export const rehostPostMetaImagesById = async (postId: string) => {
  const post = await Posts.findOne({_id: postId});
  if (!post) {
    throw new Error("Post not found");
  }
  await rehostPostMetaImages(post);
}

export const rehostAllPostMetaImages = async () => {
  const projection: Partial<Record<keyof DbPost, 1>> = {_id: 1};
  for (const field of postMetaImageFields) {
    projection[field[0] as keyof DbPost] = 1;
  }
  const posts = await Posts.find({
    $or: postMetaImageFields.map((field) => ({[field[0]]: {$exists: true}})),
  }, {projection}).fetch();
  for (const post of posts) {
    await rehostPostMetaImages(post);
  }
}

Globals.moveImageToCloudinary = moveImageToCloudinary;
Globals.convertImagesInHTML = convertImagesInHTML;
Globals.convertImagesInObject = convertImagesInObject;
Globals.rehostPostMetaImages = rehostPostMetaImages;
Globals.rehostPostMetaImagesById = rehostPostMetaImagesById;
Globals.rehostAllPostMetaImages = rehostAllPostMetaImages;
