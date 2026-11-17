import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

type ImageScope = "places" | "activities" | "hotels" | "guides" | "tourists";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("Cloudflare R2 is not fully configured. Check the R2 values in the local .env file.");
  }

  let endpointUrl: URL;
  let publicUrlBase: URL;
  try {
    endpointUrl = new URL(endpoint);
    publicUrlBase = new URL(publicUrl);
  } catch {
    throw new Error("The Cloudflare R2 endpoint or public URL is invalid.");
  }
  if (endpointUrl.protocol !== "https:" || publicUrlBase.protocol !== "https:") {
    throw new Error("The Cloudflare R2 endpoint and public URL must use HTTPS.");
  }
  if (!endpointUrl.hostname.split(".").includes(accountId)) {
    throw new Error("The Cloudflare R2 endpoint does not match the configured account ID.");
  }

  return {
    bucket,
    publicUrl: publicUrlBase.toString().replace(/\/$/, ""),
    client: new S3Client({
      region: "auto",
      endpoint: endpointUrl.toString(),
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    }),
  };
}

export async function uploadListingImages(entries: FormDataEntryValue[], scope: ImageScope) {
  const files = entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length > MAX_IMAGE_COUNT) {
    throw new Error(`Choose no more than ${MAX_IMAGE_COUNT} photos at a time.`);
  }
  if (!files.length) return [];

  for (const file of files) {
    if (!(file.type in IMAGE_TYPES)) {
      throw new Error("Photos must be JPEG, PNG, WebP, or AVIF files.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("Each photo must be 5 MB or smaller.");
    }
  }

  const { bucket, client, publicUrl } = getR2Client();
  const uploaded: { key: string; url: string }[] = [];

  try {
    for (const file of files) {
      const extension = IMAGE_TYPES[file.type as keyof typeof IMAGE_TYPES];
      const key = `directory/${scope}/${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`;
      const body = new Uint8Array(await file.arrayBuffer());
      if (!matchesImageType(body, file.type)) {
        throw new Error("A selected photo's contents do not match its file type.");
      }
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      }));
      const encodedKey = key.split("/").map(encodeURIComponent).join("/");
      uploaded.push({ key, url: `${publicUrl}/${encodedKey}` });
    }
  } catch (error) {
    const details = error && typeof error === "object" ? error as {
      name?: unknown;
      code?: unknown;
      Code?: unknown;
      $metadata?: { httpStatusCode?: unknown };
    } : {};
    console.error("R2 listing image upload failed", {
      scope,
      errorName: typeof details.name === "string" ? details.name : "UnknownError",
      errorCode: typeof details.code === "string" ? details.code : typeof details.Code === "string" ? details.Code : undefined,
      statusCode: details.$metadata?.httpStatusCode,
    });
    await Promise.allSettled(uploaded.map(({ key }) => client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))));
    throw new Error("Photo upload to Cloudflare R2 failed. Check the bucket, endpoint, and access key settings.");
  }

  return uploaded.map(({ url }) => url);
}

function matchesImageType(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (type === "image/avif") return String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" && ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)));
  return false;
}
