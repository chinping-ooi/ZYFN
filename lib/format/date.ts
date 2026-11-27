export function format_calendar_date(
  iso: string,
  time_zone: string = "UTC",
): string {
  const raw = iso.slice(0, 10);
  const instant = iso.includes("T")
    ? new Date(iso)
    : new Date(`${raw}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: time_zone,
  }).format(instant);
}

export function format_last_updated_footer(iso_date: string): string {
  return `Last updated ${format_calendar_date(iso_date)}`;
}