import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  DEFAULT_AMOUNTS_HIDDEN,
  HIDE_AMOUNTS_STORAGE_KEY,
  masked_amount_display,
  read_hide_amounts_pref,
  write_hide_amounts_pref,
} from "@/lib/hooks/hide_amounts_storage";

describe("hide_amounts storage helpers", () => {
  it("masks formatted RM strings when hidden", () => {
    expect(masked_amount_display(false, "RM 1,234.56")).toBe("RM 1,234.56");
    expect(masked_amount_display(true, "RM 1,234.56")).toBe("RM ***");
  });

  it("defaults to hidden when no preference is stored", () => {
    expect(DEFAULT_AMOUNTS_HIDDEN).toBe(true);
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    // @ts-expect-error test stub
    globalThis.window = { localStorage };
    expect(read_hide_amounts_pref()).toBe(true);
    // @ts-expect-error cleanup
    delete globalThis.window;
  });

  it("persists show/hide preference in localStorage", () => {
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    // @ts-expect-error test stub
    globalThis.window = { localStorage };
    expect(read_hide_amounts_pref()).toBe(true);
    write_hide_amounts_pref(false);
    expect(store.get(HIDE_AMOUNTS_STORAGE_KEY)).toBe("0");
    expect(read_hide_amounts_pref()).toBe(false);
    write_hide_amounts_pref(true);
    expect(store.get(HIDE_AMOUNTS_STORAGE_KEY)).toBe("1");
    expect(read_hide_amounts_pref()).toBe(true);
    // @ts-expect-error cleanup
    delete globalThis.window;
  });
});

describe("read_hide_amounts_pref without window", () => {
  const original_window = globalThis.window;

  beforeEach(() => {
    // @ts-expect-error simulate SSR
    delete globalThis.window;
  });

  afterEach(() => {
    globalThis.window = original_window;
  });

  it("returns hidden for SSR when window is undefined", () => {
    expect(read_hide_amounts_pref()).toBe(true);
  });
});