export const HIDE_AMOUNTS_STORAGE_KEY = "zyfn_hide_amounts";

/** Default and SSR: amounts hidden until the user chooses to show and we persist `"0"`. */
export const DEFAULT_AMOUNTS_HIDDEN = true;

export function read_hide_amounts_pref(): boolean {
  if (typeof window === "undefined") return DEFAULT_AMOUNTS_HIDDEN;
  const stored = window.localStorage.getItem(HIDE_AMOUNTS_STORAGE_KEY);
  if (stored === null) return DEFAULT_AMOUNTS_HIDDEN;
  return stored === "1";
}

export function write_hide_amounts_pref(hidden: boolean): void {
  window.localStorage.setItem(HIDE_AMOUNTS_STORAGE_KEY, hidden ? "1" : "0");
}

export function masked_amount_display(
  amounts_hidden: boolean,
  formatted_rm: string,
): string {
  return amounts_hidden ? "RM ***" : formatted_rm;
}