import { S3Client } from "@aws-sdk/client-s3";
export function storage() {
  if (!process.env.S3_BUCKET || !process.env.MEDIA_PUBLIC_URL)
    throw new Error("Media storage is not configured.");
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
}
