/**
 * Draws the share picture for an event onto a canvas: a Story (9:16) for
 * Instagram and WhatsApp status, a Square for feeds, and a Poster (A-size) to
 * print, each with the name, date, place, price and a QR code to the event.
 */

export type TPictureFormat = "story" | "square" | "poster";

export const PICTURE_SIZES: Record<
  TPictureFormat,
  { width: number; height: number; label: string }
> = {
  story: { width: 1080, height: 1920, label: "Story" },
  square: { width: 1080, height: 1080, label: "Square" },
  poster: { width: 1240, height: 1754, label: "Poster" },
};

export type TPictureContent = {
  name: string;
  when: string;
  where: string;
  price: string | null;
  tag: string | null;
  image: HTMLImageElement | null;
  qr: HTMLCanvasElement | null;
};

const NAVY = "#06142e";
const BLUE = "#0577FA";
const SKY = "#00b2ff";

const fontStack = () => {
  const brand =
    typeof window !== "undefined"
      ? getComputedStyle(document.documentElement)
          .getPropertyValue("--font-brand-sans")
          .trim()
      : "";
  return `${brand ? `${brand}, ` : ""}"Plus Jakarta Sans", system-ui, sans-serif`;
};

/** Breaks text into at most `maxLines` lines that fit `width`, ending in … if cut. */
const wrap = (
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  maxLines: number,
) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > width)
      last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
};

/** Fills a box with the image, cropped to cover it; a brand gradient if there's none. */
const cover = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
) => {
  if (!image || !image.naturalWidth) {
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, BLUE);
    gradient.addColorStop(1, SKY);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    return;
  }
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(
    image,
    (image.naturalWidth - sw) / 2,
    (image.naturalHeight - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h,
  );
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

const pill = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
) => {
  ctx.font = `800 ${size}px ${fontStack()}`;
  const padX = size * 0.8;
  const w = ctx.measureText(text).width + padX * 2;
  const h = size * 1.9;
  ctx.fillStyle = SKY;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 1);
  ctx.textBaseline = "alphabetic";
  return h;
};

const qrBlock = (
  ctx: CanvasRenderingContext2D,
  qr: HTMLCanvasElement | null,
  x: number,
  y: number,
  size: number,
) => {
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, size, size, size * 0.1);
  ctx.fill();
  if (qr)
    ctx.drawImage(
      qr,
      x + size * 0.08,
      y + size * 0.08,
      size * 0.84,
      size * 0.84,
    );
};

const wordmark = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = "#ffffff",
) => {
  ctx.fillStyle = color;
  ctx.font = `italic 800 ${size}px ${fontStack()}`;
  ctx.fillText("turnupz", x, y);
};

export const drawSharePicture = (
  canvas: HTMLCanvasElement,
  format: TPictureFormat,
  content: TPictureContent,
) => {
  const { width, height } = PICTURE_SIZES[format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const font = fontStack();
  ctx.clearRect(0, 0, width, height);

  if (format === "story") {
    cover(ctx, content.image, 0, 0, width, height);
    const shade = ctx.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, "rgba(6,20,46,0.35)");
    shade.addColorStop(0.45, "rgba(6,20,46,0.1)");
    shade.addColorStop(1, "rgba(6,20,46,0.96)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
    wordmark(ctx, 72, 140, 64);

    // Measured first, then laid out from the bottom: the QR sits bottom right,
    // the date, place and price beside it, the name and tag above them.
    const pad = 72;
    const qrSize = 260;
    const bottom = height - 130;
    const narrow = width - pad * 2 - qrSize - 40;
    ctx.font = `500 40px ${font}`;
    const whereLines = wrap(ctx, content.where, narrow, 2);
    const lowerHeight = 56 + whereLines.length * 54 + (content.price ? 84 : 0);
    let y = bottom - lowerHeight + 44;
    ctx.fillStyle = "#7fdcff";
    ctx.font = `800 42px ${font}`;
    ctx.fillText(
      wrap(ctx, content.when.toUpperCase(), narrow, 1)[0] ?? "",
      pad,
      y,
    );
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `500 40px ${font}`;
    for (const line of whereLines) {
      y += 54;
      ctx.fillText(line, pad, y);
    }
    if (content.price) {
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 58px ${font}`;
      ctx.fillText(content.price, pad, y + 84);
    }
    qrBlock(ctx, content.qr, width - pad - qrSize, bottom - qrSize, qrSize);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `600 30px ${font}`;
    ctx.textAlign = "right";
    ctx.fillText("Scan for tickets", width - pad, bottom + 50);
    ctx.textAlign = "left";

    ctx.font = `800 104px ${font}`;
    const title = wrap(ctx, content.name, width - pad * 2, 3);
    const titleBottom = Math.min(
      bottom - lowerHeight - 30,
      bottom - qrSize - 40,
    );
    let ty = titleBottom - (title.length - 1) * 112;
    if (content.tag) pill(ctx, content.tag, pad, ty - 104 - 70, 30);
    // pill() sets its own font; the name goes back to its size.
    ctx.font = `800 104px ${font}`;
    ctx.fillStyle = "#ffffff";
    for (const line of title) {
      ctx.fillText(line, pad, ty);
      ty += 112;
    }
    return;
  }

  if (format === "square") {
    const imageH = Math.round(height * 0.56);
    cover(ctx, content.image, 0, 0, width, imageH);
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, imageH, width, height - imageH);
    wordmark(ctx, 56, 96, 48);
    if (content.tag) pill(ctx, content.tag, 56, imageH - 80, 26);
    const pad = 56;
    const qrSize = 230;
    qrBlock(ctx, content.qr, width - pad - qrSize, imageH + 56, qrSize);
    const textWidth = width - pad * 2 - qrSize - 32;
    let y = imageH + 120;
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 64px ${font}`;
    for (const line of wrap(ctx, content.name, textWidth, 2)) {
      ctx.fillText(line, pad, y);
      y += 72;
    }
    ctx.fillStyle = "#7fdcff";
    ctx.font = `800 32px ${font}`;
    ctx.fillText(content.when.toUpperCase(), pad, y + 8);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `500 30px ${font}`;
    ctx.fillText(wrap(ctx, content.where, textWidth, 1)[0] ?? "", pad, y + 56);
    if (content.price) {
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 40px ${font}`;
      ctx.fillText(content.price, pad, height - 60);
    }
    return;
  }

  // Poster: picture on top, details on white, a big QR to scan from across the room.
  const imageH = Math.round(height * 0.5);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  cover(ctx, content.image, 0, 0, width, imageH);
  wordmark(ctx, 72, 120, 60);
  const pad = 80;
  let y = imageH + 130;
  if (content.tag) {
    pill(ctx, content.tag, pad, imageH + 40, 28);
    y += 70;
  }
  ctx.fillStyle = NAVY;
  ctx.font = `800 96px ${font}`;
  for (const line of wrap(ctx, content.name, width - pad * 2, 2)) {
    ctx.fillText(line, pad, y);
    y += 104;
  }
  ctx.fillStyle = BLUE;
  ctx.font = `800 44px ${font}`;
  ctx.fillText(content.when.toUpperCase(), pad, y + 10);
  ctx.fillStyle = "#334155";
  ctx.font = `500 40px ${font}`;
  for (const line of wrap(ctx, content.where, width - pad * 2 - 420, 2)) {
    y += 64;
    ctx.fillText(line, pad, y + 10);
  }
  const qrSize = 380;
  ctx.fillStyle = "#f1f5f9";
  roundRect(
    ctx,
    width - pad - qrSize - 20,
    height - pad - qrSize - 80,
    qrSize + 40,
    qrSize + 120,
    36,
  );
  ctx.fill();
  qrBlock(
    ctx,
    content.qr,
    width - pad - qrSize,
    height - pad - qrSize - 60,
    qrSize,
  );
  ctx.fillStyle = NAVY;
  ctx.font = `800 34px ${font}`;
  ctx.textAlign = "center";
  ctx.fillText(
    "Scan to get tickets",
    width - pad - qrSize / 2,
    height - pad + 10,
  );
  ctx.textAlign = "left";
  if (content.price) {
    ctx.fillStyle = NAVY;
    ctx.font = `800 64px ${font}`;
    ctx.fillText(content.price, pad, height - pad);
  }
};

/** Loads an image for drawing; resolves null if it can't be used (missing, or not allowed). */
export const loadImage = (src?: string | null) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    if (!src) return resolve(null);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
