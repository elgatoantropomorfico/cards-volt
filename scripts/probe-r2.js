/**
 * R2 connectivity probe. Uses env vars only — never commit credentials.
 *
 * Required:
 *   R2_ACCOUNT_ID / R2_ENDPOINT
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 */
const { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const endpoint =
  process.env.R2_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : "");

const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
const Bucket = process.env.R2_BUCKET || process.env.S3_BUCKET || "volt-cards-media";

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error("Missing R2 env vars. Set R2_ENDPOINT (or R2_ACCOUNT_ID), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.");
  process.exit(1);
}

const c = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});

(async () => {
  try {
    await c.send(new HeadBucketCommand({ Bucket }));
    console.log("HEAD OK:", Bucket);
  } catch (e) {
    console.log("HEAD FAIL", Bucket, e.$metadata?.httpStatusCode, e.name, e.message);
  }
  try {
    await c.send(
      new PutObjectCommand({
        Bucket,
        Key: "probe.txt",
        Body: "hi from probe",
        ContentType: "text/plain",
      }),
    );
    console.log("PUT OK");
  } catch (e) {
    console.log("PUT FAIL", e.name, e.message);
  }
  try {
    await c.send(new GetObjectCommand({ Bucket, Key: "probe.txt" }));
    console.log("GET OK");
  } catch (e) {
    console.log("GET FAIL", e.name, e.message);
  }
})();
