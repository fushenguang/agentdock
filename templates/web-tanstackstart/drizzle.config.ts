import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/infra/db/sqlite/schema.ts",
  out: "./drizzle/sqlite",
  dbCredentials: {
    url: process.env.SQLITE_DATABASE_URL ?? "./data/app.db",
  },
});
