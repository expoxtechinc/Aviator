import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("Creator Studio analytics", () => {
  it("queries persisted creator-scoped events and renders non-fabricated metrics", () => {
    const source = read("client/src/pages/CreatorHub.tsx");
    expect(source).toContain('from("creator_analytics_events")');
    expect(source).toContain('.eq("creator_id", creatorId)');
    expect(source).toContain('event_type === "profile_view"');
    expect(source).toContain('event_type === "beat_play"');
    expect(source).toContain("Real engagement");
    expect(source).not.toMatch(/1234|5678|99\.9/);
  });
});

it("keeps the analytics source free of client-side provider secrets", () => {
  const source = read("client/src/pages/CreatorHub.tsx");
  expect(source).not.toMatch(/AIza|gsk_|sk-or-|hf_/);
});
