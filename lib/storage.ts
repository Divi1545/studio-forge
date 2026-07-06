import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl as presign } from "@aws-sdk/s3-request-presigner";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    endpoint: requiredEnv("S3_ENDPOINT"),
    region: process.env.S3_REGION ?? "auto",
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv("S3_ACCESS_KEY"),
      secretAccessKey: requiredEnv("S3_SECRET_KEY"),
    },
  });
  return client;
}

function getBucket(): string {
  return requiredEnv("S3_BUCKET");
}

export interface PutObjectOptions {
  contentType?: string;
  cacheControl?: string;
}

export async function putObject(
  key: string,
  body: PutObjectCommandInput["Body"],
  options: PutObjectOptions = {},
): Promise<{ key: string; bucket: string }> {
  const bucket = getBucket();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: options.contentType,
      CacheControl: options.cacheControl,
    }),
  );
  return { key, bucket };
}

export async function getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  return presign(
    getClient(),
    new GetObjectCommand({ Bucket: getBucket(), Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}
