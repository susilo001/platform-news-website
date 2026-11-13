import { NextResponse } from "next/server";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { getActor } from "@/modules/auth/session";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { detectImage, maxUploadBytes } from "@/modules/media/validation";
import { rateLimit } from "@/lib/rate-limit";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(process.env.AUTH_URL ?? request.url).origin)
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const actor = await getActor();
  try {
    await rateLimit(`upload:${actor.id}`, 20, 60000);
    if (Number(request.headers.get("content-length")) > maxUploadBytes + 100000)
      return NextResponse.json(
        { error: "Maximum upload size is 8 MB." },
        { status: 413 },
      );
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
      throw new Error("Expected a multipart image upload.");
    const reader = request.body?.getReader();
    if (!reader) throw new Error("No upload body.");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxUploadBytes + 100000) {
        await reader.cancel();
        throw new Error("Maximum upload size is 8 MB.");
      }
      chunks.push(value);
    }
    const bounded = Buffer.concat(chunks);
    const form = await new Response(bounded, {
      headers: { "content-type": request.headers.get("content-type")! },
    }).formData();
    const file = form.get("file");
    const altText = String(form.get("altText") ?? "").trim();
    if (
      !(file instanceof File) ||
      file.size > maxUploadBytes ||
      file.size === 0 ||
      altText.length < 3 ||
      altText.length > 500
    )
      throw new Error(
        "Choose an image under 8 MB and add descriptive alt text.",
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImage(buffer);
    if (detected.mime !== file.type)
      throw new Error("File content does not match its declared type.");
    const meta = await sharp(buffer, {
      limitInputPixels: 40_000_000,
    }).metadata();
    if (
      !meta.width ||
      !meta.height ||
      meta.width < 100 ||
      meta.height < 100 ||
      (meta.pages && meta.pages > 1)
    )
      throw new Error("Use a non-animated image at least 100×100 pixels.");
    // Re-encode to strip metadata and reject malformed image payloads.
    const clean = await sharp(buffer, { limitInputPixels: 40_000_000 })
      .rotate()
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
    const key = `images/${randomUUID()}.webp`;
    const s3 = storage();
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: clean.data,
        ContentType: "image/webp",
        CacheControl: "public,max-age=31536000,immutable",
      }),
    );
    try {
      const media = await db.$transaction(async (tx) => {
        const media = await tx.media.create({
          data: {
            storageKey: key,
            url: `${process.env.MEDIA_PUBLIC_URL!.replace(/\/$/, "")}/${key}`,
            mimeType: "image/webp",
            sizeBytes: clean.data.length,
            width: clean.info.width,
            height: clean.info.height,
            altText,
            uploadedBy: actor.id,
          },
        });
        await tx.auditEvent.create({
          data: {
            actorId: actor.id,
            entityType: "Media",
            entityId: media.id,
            action: "MEDIA_UPLOADED",
            metadata: { key },
          },
        });
        return media;
      });
      return NextResponse.json({ id: media.id });
    } catch (e) {
      await s3.send(
        new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
      );
      throw e;
    }
  } catch (e) {
    console.error("media.upload.failed", { actor: actor.id, error: String(e) });
    return NextResponse.json(
      {
        error:
          e instanceof Error && !/prisma|credential|ECONN|S3/i.test(e.message)
            ? e.message
            : "Upload failed. Check storage configuration and try again.",
      },
      { status: 400 },
    );
  }
}
