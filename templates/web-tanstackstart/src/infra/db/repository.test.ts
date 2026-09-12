import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, describe, expect, it } from "vitest";
import { getDataProvider } from "../providers";
import { createSqliteDatabase } from "./sqlite/client";
import { SqliteGreetingRepository } from "./sqlite/repository";
import * as postgresSchema from "./supabase/schema";

const originalDataProvider = process.env.DATA_PROVIDER;

afterEach(() => {
  if (originalDataProvider === undefined) {
    delete process.env.DATA_PROVIDER;
  } else {
    process.env.DATA_PROVIDER = originalDataProvider;
  }
});

describe("SQLite greeting repository", () => {
  it("creates and lists greetings through the repository contract", async () => {
    const db = createSqliteDatabase(":memory:");
    migrate(db, { migrationsFolder: "./drizzle/sqlite" });

    const repository = new SqliteGreetingRepository(db);
    const created = await repository.create({ message: "hello from sqlite" });
    const greetings = await repository.list();

    expect(created.id).toBeGreaterThan(0);
    expect(greetings).toHaveLength(1);
    expect(greetings[0]?.message).toBe("hello from sqlite");
  });
});

describe("Supabase schema", () => {
  it("defines the same greeting table contract", () => {
    expect(postgresSchema.greetings).toBeDefined();
    expect(postgresSchema.greetings.message.name).toBe("message");
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
