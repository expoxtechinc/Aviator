import { readFile, writeFile } from "node:fs/promises";

const sql = await readFile("supabase/migrations/20260811_beatbox_rpc_hardening.sql", "utf8");
await writeFile(".supabase-rpc-hardening.json", JSON.stringify({
  project_id: "huhsbpjdwepovtjraxsd",
  name: "beatbox_rpc_hardening",
  query: sql,
}, null, 2));
