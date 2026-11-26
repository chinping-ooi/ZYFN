import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  DEFAULT_SHOW_GO_PLUS,
  SHOW_GO_PLUS_STORAGE_KEY,
  read_show_go_plus_pref,
  write_show_go_plus_pref,
} from "@/lib/hooks/show_go_plus_storage";

describe("show_go_plus storage helpers", () => {
  it("defaults to hidden when no preference is stored", () => {
    expect(DEFAULT_SHOW_GO_PLUS).toBe(false);
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    // @ts-expect-error test stub
    globalThis.window = { localStorage };
    expect(read_show_go_plus_pref()).toBe(false);
    // @ts-expect-error cleanup
    delete globalThis.window;
  });

  it("persists show preference in localStorage", () => {
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    // @ts-expect-error test stub
    globalThis.window = { localStorage };
    expect(read_show_go_plus_pref()).toBe(false);
    write_show_go_plus_pref(true);
    expect(store.get(SHOW_GO_PLUS_STORAGE_KEY)).toBe("1");
    expect(read_show_go_plus_pref()).toBe(true);
    write_show_go_plus_pref(false);
    expect(store.get(SHOW_GO_PLUS_STORAGE_KEY)).toBe("0");
    expect(read_show_go_plus_pref()).toBe(false);
    // @ts-expect-error cleanup
    delete globalThis.window;
  });
});

describe("read_show_go_plus_pref without window", () => {
  const original_window = globalThis.window;

  beforeEach(() => {
    // @ts-expect-error simulate SSR
    delete globalThis.window;
  });

  afterEach(() => {
    globalThis.window = original_window;
  });

  it("returns hidden for SSR when window is undefined", () => {
    expect(read_show_go_plus_pref()).toBe(false);
  });
});