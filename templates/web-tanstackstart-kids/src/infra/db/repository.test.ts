import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, describe, expect, it } from "vitest";
import { getDataProvider } from "../providers";
import { createSqliteDatabase } from "./sqlite/client";
import { SqliteActivityCompletionRepository } from "./sqlite/repository";
import * as postgresSchema from "./supabase/schema";

const originalDataProvider = process.env.DATA_PROVIDER;

afterEach(() => {
  if (originalDataProvider === undefined) {
    delete process.env.DATA_PROVIDER;
  } else {
    process.env.DATA_PROVIDER = originalDataProvider;
  }
});

describe("SQLite activity completion repository", () => {
  it("records and lists activity completions through the repository contract", async () => {
    const db = createSqliteDatabase(":memory:");
    migrate(db, { migrationsFolder: "./drizzle/sqlite" });

    const repository = new SqliteActivityCompletionRepository(db);
    const created = await repository.create({ activityKey: "shape-sort" });
    const completions = await repository.list();

    expect(created.id).toBeGreaterThan(0);
    expect(completions).toHaveLength(1);
    expect(completions[0]?.activityKey).toBe("shape-sort");
  });
});

describe("Supabase activity completion schema", () => {
  it("defines the same activity completion table contract", () => {
    expect(postgresSchema.activityCompletions).toBeDefined();
    expect(postgresSchema.activityCompletions.activityKey.name).toBe("activity_key");
  });
});

describe("data provider selection", () => {
  it("defaults to sqlite", () => {
    delete process.env.DATA_PROVIDER;
    expect(getDataProvider()).toBe("sqlite");
  });

  it("accepts supabase explicitly", () => {
    process.env.DATA_PROVIDER = "supabase";
    expect(getDataProvider()).toBe("supabase");
  });

  it("fails loudly for an unsupported provider", () => {
    process.env.DATA_PROVIDER = "mysql";
    expect(() => getDataProvider()).toThrow('Unsupported DATA_PROVIDER "mysql"');
  });
});
