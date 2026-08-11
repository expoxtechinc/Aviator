import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(new URL("../supabase/migrations/20260811_beatbox_completeness.sql", import.meta.url), "utf8");
const payload = {
  project_id: "huhsbpjdwepovtjraxsd",
  name: "beatbox_completeness",
  query,
};

await writeFile(new URL("../.supabase-completeness-payload.json", import.meta.url), `${JSON.stringify(payload)}\n`);
