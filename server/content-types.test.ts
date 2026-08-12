import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolvePreviewKind } from "../client/src/lib/preview";
import SecurePreview from "../client/src/components/SecurePreview";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("BeatBox expanded creator content types", () => {
  it("keeps the database contract additive for movie, app, and digital product", () => {
    const migration = read("supabase/migrations/20260812_beatbox_content_type_expansion.sql");
    expect(migration).toContain("'movie'");
    expect(migration).toContain("'app'");
    expect(migration).toContain("'digital_product'");
    expect(migration).toContain("drop constraint if exists");
    expect(migration).toContain("beats_content_type_check");
    expect(migration).toContain("content_items_content_type_check");
  });

  it("exposes the new types in creator publishing and public discovery", () => {
    const models = read("client/src/lib/models.ts");
    const studio = read("client/src/pages/CreatorHub.tsx");
    const catalog = read("client/src/pages/MarketCatalog.tsx");
    for (const type of ["movie", "app", "digital_product"]) {
      expect(models).toContain(`"${type}"`);
      expect(studio).toContain(`value="${type}"`);
      expect(catalog).toContain(`value="${type}"`);
    }
    expect(catalog).toContain("resolvePreviewKind");
  });

  it("renders the correct secure preview state for each media kind", () => {
    const close = () => undefined;
    expect(renderToStaticMarkup(createElement(SecurePreview, { url: "https://example.test/movie.mp4", kind: "video", onClose: close }))).toContain("<video");
    expect(renderToStaticMarkup(createElement(SecurePreview, { url: "https://example.test/preview.mp3", kind: "audio", onClose: close }))).toContain("<audio");
    const unsupported = renderToStaticMarkup(createElement(SecurePreview, { url: "https://example.test/app.zip", kind: "unsupported", onClose: close }));
    expect(unsupported).toContain("not directly playable");
    expect(unsupported).toContain("Close");
  });

  it("selects a safe renderer from the secure preview MIME/type", () => {
    expect(resolvePreviewKind("video/mp4", "app")).toBe("video");
    expect(resolvePreviewKind("video/webm", "digital_product")).toBe("video");
    expect(resolvePreviewKind("audio/mpeg", "movie")).toBe("audio");
    expect(resolvePreviewKind(null, "movie")).toBe("video");
    expect(resolvePreviewKind("application/zip", "app")).toBe("unsupported");
    expect(resolvePreviewKind(undefined, "digital_product")).toBe("unsupported");
  });
});
