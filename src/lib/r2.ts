import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = process.env.R2_BUCKET || "volt-cards";
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

let _client: S3Client | null = null;

export function r2Client(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.");
  }
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _client;
}

export function isR2Configured() {
  return Boolean(accountId && accessKeyId && secretAccessKey && R2_PUBLIC_URL);
}

export async function uploadToR2(opts: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}) {
  await r2Client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${R2_PUBLIC_URL}/${opts.key}`;
}

export async function deleteFromR2(key: string) {
  await r2Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

export function keyFromPublicUrl(url: string | null | undefined): string | null {
  if (!url || !R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL + "/")) return null;
  return url.slice(R2_PUBLIC_URL.length + 1);
}
