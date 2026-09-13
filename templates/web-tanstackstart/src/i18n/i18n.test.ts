import { describe, expect, it } from "vitest";
import { enCatalog, zhCNCatalog } from "./messages";
import { localizedHref } from "./locale-href";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale } from "./locales";

describe("locale configuration", () => {
  it("keeps the supported locale list explicit", () => {
    expect(SUPPORTED_LOCALES).toEqual(["zh-CN", "en"]);
    expect(DEFAULT_LOCALE).toBe("zh-CN");
  });

  it("validates route locale parameters", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("zh-CN")).toBe(true);
    expect(isSupportedLocale("zh")).toBe(false);
    expect(isSupportedLocale("fr")).toBe(false);
  });

  it("switches the locale while preserving path, query, and hash", () => {
    expect(
      localizedHref(
        {
          pathname: "/en/hello",
          searchStr: "?from=overview",
          hash: "stored",
        },
        "zh-CN",
      ),
    ).toBe("/zh-CN/hello?from=overview#stored");
  });
});

describe("application message catalogs", () => {
  it("keeps localized catalogs in parity with the English source catalog", () => {
    expect(Object.keys(zhCNCatalog).toSorted()).toEqual(Object.keys(enCatalog).toSorted());
  });

  it("provides a non-empty default message for every key", () => {
    for (const [key, entry] of Object.entries(enCatalog)) {
      expect(entry.defaultMessage, key).not.toBe("");
    }
    for (const [key, entry] of Object.entries(zhCNCatalog)) {
      expect(entry.defaultMessage, key).not.toBe("");
    }
  });
});
