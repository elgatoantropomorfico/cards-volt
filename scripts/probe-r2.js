const { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const c = new S3Client({
  region: "auto",
  endpoint: "https://3d0f55e927ee9454adffef55a5cd7eab.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "e34ee51f4dcd6d961cf09151bd60a428",
    secretAccessKey: "eb345b51514a87a822d5313923cbe50d37dc81f5cec8ccfd3074a91c80ebade7",
  },
});

(async () => {
  const Bucket = "volt-cards-media";
  try {
    await c.send(new HeadBucketCommand({ Bucket }));
    console.log("HEAD OK:", Bucket);
  } catch (e) {
    console.log("HEAD FAIL", Bucket, e.$metadata?.httpStatusCode, e.name, e.message);
  }
  try {
    await c.send(new PutObjectCommand({ Bucket, Key: "probe.txt", Body: "hi from probe", ContentType: "text/plain" }));
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
