import { ImageResponse } from "next/og";

/**
 * Social share image for pages without their own photo: /og/?title=…&eyebrow=…
 * 1200×630, brand teal, title in large type.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "San Carlos Life").slice(0, 140);
  const eyebrow = (searchParams.get("eyebrow") || "San Carlos, California").slice(0, 60);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1F7A7A",
          color: "#fff",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#E6F4F4", fontFamily: "sans-serif" }}>{eyebrow}</div>
        <div style={{ fontSize: title.length > 70 ? 56 : 72, lineHeight: 1.1, display: "flex" }}>{title}</div>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 40 }}>
          <span>SanCarlos</span>
          <span style={{ color: "#B9E4E4" }}>Life</span>
          <span style={{ fontSize: 24, marginLeft: 16, color: "#E6F4F4", fontFamily: "sans-serif" }}>By Vabrato Real Estate</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}
