export type AccountViewMode = "summary" | "statement";

export const ACCOUNT_VIEW_STORAGE_KEY = "zyfn_account_view";

export function read_account_view_preference(): AccountViewMode {
  if (typeof window === "undefined") return "summary";
  try {
    const raw = window.localStorage.getItem(ACCOUNT_VIEW_STORAGE_KEY);
    return raw === "statement" ? "statement" : "summary";
  } catch {
    return "summary";
  }
}

export function write_account_view_preference(mode: AccountViewMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCOUNT_VIEW_STORAGE_KEY, mode);
    window.dispatchEvent(new Event("zyfn-account-view-change"));
  } catch {
    /* ignore quota / privacy */
  }
}