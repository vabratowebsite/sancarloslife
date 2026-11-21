import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { acceptableType, PhotoError, reencode } from "@/lib/media/fromUrl";

const jpeg = (w: number, h: number, exif?: Record<string, Record<string, string>>) => {
  const img = sharp({ create: { width: w, height: h, channels: 3, background: { r: 40, g: 120, b: 130 } } }).jpeg();
  return (exif ? img.withExif(exif) : img).toBuffer();
};

describe("photos from a URL", () => {
  it("accepts raster photo types only", () => {
    for (const t of ["image/jpeg", "image/png; charset=binary", "IMAGE/WEBP", "image/avif", "image/gif"]) expect(acceptableType(t), t).toBe(true);
    for (const t of ["image/svg+xml", "text/html", "application/octet-stream", ""]) expect(acceptableType(t), t).toBe(false);
  });

  it("re-encodes to JPEG, drops EXIF (location) and caps the size", async () => {
    const input = await jpeg(3000, 2000, { IFD0: { Copyright: "secret-owner" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "37/1 30/1 0/1" } });
    expect((await sharp(input).metadata()).exif).toBeTruthy();
    const out = await reencode(input);
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.exif).toBeUndefined();
    expect(Math.max(out.width, out.height)).toBe(2400);
    expect(out.buffer.includes(Buffer.from("secret-owner"))).toBe(false);
  });

  it("refuses tiny images, SVG and things that aren't images", async () => {
    await expect(reencode(await jpeg(300, 200))).rejects.toBeInstanceOf(PhotoError);
    await expect(reencode(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><script>alert(1)</script></svg>'))).rejects.toBeInstanceOf(PhotoError);
    await expect(reencode(Buffer.from("<html>not an image</html>"))).rejects.toBeInstanceOf(PhotoError);
  });
});
