import { readFile, writeFile } from "node:fs/promises";

const [entrypoint, deno] = await Promise.all([
  readFile(new URL("../supabase/functions/secure-download/index.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/functions/secure-download/deno.json", import.meta.url), "utf8"),
]);

await writeFile(
  new URL("../.secure-download-deploy.json", import.meta.url),
  JSON.stringify({
    project_id: "huhsbpjdwepovtjraxsd",
    name: "secure-download",
    verify_jwt: true,
    entrypoint_path: "index.ts",
    files: [
      { name: "index.ts", content: entrypoint },
      { name: "deno.json", content: deno },
    ],
  }),
);
