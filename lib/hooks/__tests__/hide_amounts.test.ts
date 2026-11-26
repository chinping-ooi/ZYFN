import { describe, expect, it } from "vitest";
import {
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

  it("persists preference in localStorage", () => {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
    // @ts-expect-error test stub
    globalThis.window = { localStorage };
    expect(read_hide_amounts_pref()).toBe(false);
    write_hide_amounts_pref(true);
    expect(store.get(HIDE_AMOUNTS_STORAGE_KEY)).toBe("1");
    expect(read_hide_amounts_pref()).toBe(true);
    write_hide_amounts_pref(false);
    expect(read_hide_amounts_pref()).toBe(false);
    // @ts-expect-error cleanup
    delete globalThis.window;
  });
});