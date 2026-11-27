/** Statement view segment (summary is the account base path). */
export const ACCOUNT_STATEMENT_SEGMENT = "statement";

export function account_statement_href(account_base_path: string): string {
  const base = account_base_path.replace(/\/$/, "");
  return `${base}/${ACCOUNT_STATEMENT_SEGMENT}`;
}

export function append_search_query(
  path: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
): string {
  if (!searchParams) return path;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value.length > 0) {
      usp.set(key, value);
    } else if (Array.isArray(value)) {
      for (const part of value) {
        if (part.length > 0) usp.append(key, part);
      }
    }
  }
  const query = usp.toString();
  return query ? `${path}?${query}` : path;
}