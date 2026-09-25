import { z } from "zod";

const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;

function extractVideoId(value: string): string | null {
  if (!value || videoIdPattern.test(value)) return value;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    let id: string | null = null;
    if (["youtu.be", "www.youtu.be"].includes(host) && parts.length === 1) id = parts[0]!;
    if (["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (parts.length === 2 && ["shorts", "embed", "live"].includes(parts[0]!)) id = parts[1]!;
    }
    return id && videoIdPattern.test(id) ? id : null;
  } catch {
    return null;
  }
}

// Normalize at the API boundary so drafts and published versions store only IDs.
export const youtubeVideoSchema = z.string().trim().max(2048).transform((value, ctx) => {
  const id = extractVideoId(value);
  if (id !== null) return id;
  ctx.addIssue({ code: "custom", message: "Informe um link válido de vídeo do YouTube ou seu ID de 11 caracteres." });
  return z.NEVER;
});
