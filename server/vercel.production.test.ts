import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

describe("Vercel production contract", () => {
  it("uses the frozen build and public output directory", () => {
    const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
    expect(config.buildCommand).toBe("pnpm build");
    expect(config.installCommand).toContain("pnpm install --frozen-lockfile");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "/(.*)", destination: "/index.html" }),
    ]));
  });

  it("keeps the tRPC function and SEO assets in the deployable source", () => {
    expect(fs.existsSync(path.join(root, "api/trpc/[trpc].ts"))).toBe(true);
    expect(fs.readFileSync(path.join(root, "client/public/google7c2d5df9354788c6.html"), "utf8")).toContain("google-site-verification");
    expect(fs.readFileSync(path.join(root, "client/public/robots.txt"), "utf8")).toContain("Sitemap:");
    expect(fs.readFileSync(path.join(root, "client/public/sitemap.xml"), "utf8")).toContain("https://beat-box-org.vercel.app");
  });
});
