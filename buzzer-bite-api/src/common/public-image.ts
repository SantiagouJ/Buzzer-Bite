import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type PublicImage = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

export async function savePublicImage(
  configService: ConfigService,
  file: PublicImage,
  folder: "stores" | "packs",
): Promise<string> {
  if (!file.buffer?.length) {
    throw new BadRequestException("La imagen es obligatoria");
  }

  const extension = IMAGE_TYPES[file.mimetype as keyof typeof IMAGE_TYPES];
  if (!extension) {
    throw new BadRequestException("La imagen debe ser jpeg, png o webp");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new BadRequestException("La imagen no puede superar 5 MB");
  }

  const endpoint = configService.get<string>("AWS_ENDPOINT_URL_S3")?.replace(/\/$/, "");
  const bucket = configService.get<string>("IMAGES_BUCKET");
  const accessKeyId = configService.get<string>("AWS_ACCESS_KEY_ID");
  const secretAccessKey = configService.get<string>("AWS_SECRET_ACCESS_KEY");
  const region = configService.get<string>("AWS_REGION");

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !region) {
    throw new ServiceUnavailableException(
      "El almacenamiento de imágenes no está configurado",
    );
  }

  const key = `${folder}/${randomUUID()}.${extension}`;
  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `${endpoint}/${bucket}/${key}`;
}
