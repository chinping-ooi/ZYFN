export type FdStatus = "active" | "due" | "matured";

export function resolve_fd_status(
  maturity_iso: string,
  as_of_iso: string,
  matured_flag?: boolean,
): FdStatus {
  if (matured_flag) return "matured";
  const as_of = new Date(as_of_iso + "T00:00:00Z");
  const maturity = new Date(maturity_iso + "T00:00:00Z");
  if (maturity < as_of) return "matured";
  const due_window = new Date(as_of);
  due_window.setUTCDate(due_window.getUTCDate() + 30);
  if (maturity <= due_window) return "due";
  return "active";
}

export function status_label(status: FdStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "due":
      return "Due soon";
    case "matured":
      return "Matured";
  }
}