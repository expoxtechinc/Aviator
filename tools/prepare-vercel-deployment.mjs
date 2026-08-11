import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist/public");

async function collect(directory, relative = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const currentRelative = path.posix.join(relative, entry.name);
    const currentAbsolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collect(currentAbsolute, currentRelative));
      continue;
    }
    const data = await readFile(currentAbsolute);
    files.push({ file: currentRelative, data: data.toString("base64"), encoding: "base64" });
  }
  return files;
}

const files = await collect(root);
files.push({
  file: "vercel.json",
  data: JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/index.html" }] }),
  encoding: "utf-8",
});

await writeFile(".vercel-beatbox-deployment.json", JSON.stringify({
  name: "beatbox",
  target: "production",
  teamId: "team_1ZNJyXBJQkkA9ZlruhSMgVYM",
  files,
}, null, 2));
