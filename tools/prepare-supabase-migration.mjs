import { readFile, writeFile } from "node:fs/promises";

const query = await readFile(
  "/home/ubuntu/beatbox/supabase/migrations/20260811_beatbox_security_and_marketplace.sql",
  "utf8",
);

await writeFile(
  "/home/ubuntu/beatbox/.supabase-apply-input.json",
  JSON.stringify(
    {
      name: "beatbox_security_and_marketplace",
      project_id: "huhsbpjdwepovtjraxsd",
      query,
    },
    null,
    2,
  ),
);
