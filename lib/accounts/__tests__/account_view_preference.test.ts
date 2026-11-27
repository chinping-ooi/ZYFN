import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNT_VIEW_STORAGE_KEY,
  read_account_view_preference,
  write_account_view_preference,
} from "@/lib/accounts/account_view_preference";

describe("account_view_preference", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to summary when storage is empty", () => {
    expect(read_account_view_preference()).toBe("summary");
  });

  it("persists statement after write", () => {
    write_account_view_preference("statement");
    expect(storage.get(ACCOUNT_VIEW_STORAGE_KEY)).toBe("statement");
    expect(read_account_view_preference()).toBe("statement");
    write_account_view_preference("summary");
    expect(read_account_view_preference()).toBe("summary");
  });
});