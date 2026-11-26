export const HIDE_AMOUNTS_STORAGE_KEY = "zyfn_hide_amounts";

export function read_hide_amounts_pref(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(HIDE_AMOUNTS_STORAGE_KEY) === "1";
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