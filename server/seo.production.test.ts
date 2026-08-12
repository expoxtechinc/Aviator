import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function source(relativePath: string) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

describe("BeatBox production SEO contract", () => {
  it("serves the exact Google Search Console verification file", async () => {
    const verification = await source("client/public/google7c2d5df9354788c6.html");
    expect(verification.trim()).toBe("google-site-verification: google7c2d5df9354788c6.html");
  });

  it("uses the production host in robots and sitemap", async () => {
    const robots = await source("client/public/robots.txt");
    const sitemap = await source("client/public/sitemap.xml");

    expect(robots).toContain("Sitemap: https://beat-box-org.vercel.app/sitemap.xml");
    expect(sitemap).toContain("https://beat-box-org.vercel.app/");
    expect(sitemap).not.toContain("beatbox.manus.space");
    expect(robots).toContain("Disallow: /cart");
    expect(robots).toContain("Disallow: /api/");
  });

  it("keeps the verification and canonical tags in the HTML shell", async () => {
    const html = await source("client/index.html");

    expect(html).toContain('meta name="google-site-verification" content="google7c2d5df9354788c6"');
    expect(html).toContain('link rel="canonical" href="https://beat-box-org.vercel.app/"');
    expect(html).toContain('meta name="twitter:card" content="summary_large_image"');
  });

  it("implements route-aware noindex and canonical metadata", async () => {
    const hook = await source("client/src/hooks/usePageMeta.ts");

    expect(hook).toContain("noindex,nofollow,noarchive");
    expect(hook).toContain('link[rel="${rel}"]');
    expect(hook).toContain("application/ld+json");
    expect(hook).toContain("SITE_URL = \"https://beat-box-org.vercel.app\"");
  });
});
