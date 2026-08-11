import { readFile, writeFile } from "node:fs/promises";

const sql = await readFile("supabase/migrations/20260811_beatbox_trigger_search_path.sql", "utf8");
await writeFile(".supabase-trigger-search-path.json", JSON.stringify({
  project_id: "huhsbpjdwepovtjraxsd",
  name: "beatbox_trigger_search_path",
  query: sql,
}, null, 2));
