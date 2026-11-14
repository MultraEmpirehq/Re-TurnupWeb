import { ImageResponse } from "next/og";
import { fetchNewsPost } from "@/lib/company-news-server";

const size = { width: 1200, height: 630 };

/**
 * The site's own face (Plus Jakarta Sans), only the letters this image uses,
 * from Google Fonts. The image renderer needs TTF, which Google sends to a
 * client that doesn't ask for woff2. Without it, the default face is used.
 */
const loadFont = async (weight: number, text: string) => {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}&text=${encodeURIComponent(text)}`,
        { next: { revalidate: 86400 } },
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url, { next: { revalidate: 86400 } })).arrayBuffer();
  } catch {
    return null;
  }
};
export const revalidate = 300;

/**
 * The picture a shared news link shows (turnupz.com/news/<slug>/share-image):
 * the post's cover with its title over it, or the title on Turnupz blue when
 * there's no cover. Its own route, so the link previews can give its full
 * turnupz.com address whatever server the site runs on.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchNewsPost(slug);
  const title = post?.title ?? "Turnupz News";
  const date = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const text = `turnupzNEWS${title}${date}`;
  const [bold, semi] = await Promise.all([loadFont(800, text), loadFont(600, text)]);
  const fonts = [
    ...(bold ? [{ name: "Plus Jakarta Sans", data: bold, weight: 800 as const, style: "normal" as const }] : []),
    ...(semi ? [{ name: "Plus Jakarta Sans", data: semi, weight: 600 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #00b2ff 0%, #0577fa 45%, #023064 100%)",
        }}
      >
        {post?.cover && (
          // A generated image only understands plain <img>, not next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            background: post?.cover
              ? "linear-gradient(180deg, rgba(1,12,25,0.15) 0%, rgba(1,12,25,0.85) 70%)"
              : "transparent",
            color: "#ffffff",
            fontFamily: "Plus Jakarta Sans",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700 }}>
            <span style={{ letterSpacing: -0.5 }}>turnupz</span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: "uppercase",
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.18)",
              }}
            >
              News
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: title.length > 60 ? 54 : 66, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>
              {title}
            </div>
            {date && <div style={{ fontSize: 26, fontWeight: 600, opacity: 0.85 }}>{date}</div>}
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
