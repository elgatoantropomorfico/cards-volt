const { S3Client, HeadBucketCommand, PutObjectCommand, CreateBucketCommand } = require("@aws-sdk/client-s3");

const c = new S3Client({
  region: "auto",
  endpoint: "https://3d0f55e927ee9454adffef55a5cd7eab.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "e878604295e244ae1cb3cb66fa818a99",
    secretAccessKey: "7a00c88d242219a240b8c5f1545585864967497a66c1ac6f1488eee16d308d85",
  },
});

(async () => {
  const tries = ["volt-cards", "voltcards", "volt_cards", "cards", "cards-volt", "volt", "voltaiagents"];
  for (const b of tries) {
    try {
      await c.send(new HeadBucketCommand({ Bucket: b }));
      console.log("HEAD OK:", b);
    } catch (e) {
      console.log("HEAD FAIL", b, "->", e.$metadata && e.$metadata.httpStatusCode, e.name);
    }
  }

  // Try creating volt-cards
  try {
    await c.send(new CreateBucketCommand({ Bucket: "volt-cards" }));
    console.log("CREATED volt-cards");
  } catch (e) {
    console.log("CREATE FAIL volt-cards ->", e.name, e.message);
  }

  // Try a PUT
  try {
    await c.send(new PutObjectCommand({ Bucket: "volt-cards", Key: "probe.txt", Body: "hi", ContentType: "text/plain" }));
    console.log("PUT OK volt-cards");
  } catch (e) {
    console.log("PUT FAIL volt-cards ->", e.name, e.message);
  }
})();
