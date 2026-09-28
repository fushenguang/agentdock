import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infra/db/supabase/schema.ts",
  out: "./drizzle/supabase",
  dbCredentials: {
    url:
      process.env.SUPABASE_DATABASE_URL ??
      "postgres://YOUR_USER:YOUR_PASSWORD@localhost:5432/postgres",
  },
});
