export type PreviewKind = "audio" | "video" | "unsupported";

/** Resolve a browser-safe preview renderer from the secure function MIME/type response. */
export function resolvePreviewKind(contentType: string | null | undefined, itemType: string): PreviewKind {
  const normalized = (contentType || "").toLowerCase();
  if (normalized.startsWith("video/") || normalized === "video" || normalized === "movie") return "video";
  if (normalized.startsWith("audio/") || normalized === "audio") return "audio";
  if (itemType === "movie") return "video";
  return "unsupported";
}
