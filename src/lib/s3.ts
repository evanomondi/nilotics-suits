import AWS from "aws-sdk";

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET,
  region: process.env.S3_REGION || "us-east-1",
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

export async function getPresignedUrl(
  key: string,
  contentType: string
): Promise<string> {
  const params = {
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Expires: 3600, // 1 hour
    ContentType: contentType,
  };

  return s3.getSignedUrlPromise("putObject", params);
}

export async function getFileUrl(key: string): Promise<string> {
  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
}
