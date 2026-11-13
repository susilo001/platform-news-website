export const maxUploadBytes = 8 * 1024 * 1024;
export function detectImage(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { mime: "image/jpeg", extension: "jpg" };
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
    return { mime: "image/png", extension: "png" };
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return { mime: "image/webp", extension: "webp" };
  throw new Error(
    "Upload a JPEG, PNG, or WebP image. SVG and animated formats are not supported.",
  );
}
