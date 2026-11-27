export const SHOW_GO_PLUS_STORAGE_KEY = "zyfn_show_go_plus";

/** Default and SSR: GO+ rows hidden until the user enables and we persist `"1"`. */
export const DEFAULT_SHOW_GO_PLUS = false;

export function read_show_go_plus_pref(): boolean {
  if (typeof window === "undefined") return DEFAULT_SHOW_GO_PLUS;
  return window.localStorage.getItem(SHOW_GO_PLUS_STORAGE_KEY) === "1";
}

export function write_show_go_plus_pref(show: boolean): void {
  window.localStorage.setItem(SHOW_GO_PLUS_STORAGE_KEY, show ? "1" : "0");
}