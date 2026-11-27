/** Routes where global month selector is hidden. */
export function global_month_hidden_path(pathname: string): boolean {
  if (pathname === "/import") return true;
  if (pathname.startsWith("/_not-found")) return true;
  return false;
}

/** Account hub paths with summary + statement (global pie/list toggle). */
export function account_view_from_pathname(pathname: string): {
  view_base_path: string;
  active_view: "statement" | "summary";
} | null {
  if (!pathname.startsWith("/transactions/") && !pathname.startsWith("/credit-cards/")) {
    return null;
  }

  if (pathname.endsWith("/statement")) {
    const base = pathname.slice(0, -"/statement".length);
    if (!is_account_hub_base(base)) return null;
    return { view_base_path: base, active_view: "statement" };
  }

  let base = pathname;
  if (pathname.endsWith("/summary")) {
    base = pathname.slice(0, -"/summary".length);
  }

  if (!is_account_hub_base(base)) return null;
  return { view_base_path: base, active_view: "summary" };
}

function is_account_hub_base(path: string): boolean {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2) return false;
  return parts[0] === "transactions" || parts[0] === "credit-cards";
}