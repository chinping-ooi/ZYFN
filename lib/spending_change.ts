export type SpendingChange = {
  pct: number;
  direction: "up" | "down" | "flat";
  label: string;
};

/** Spending up vs prior month is bad (red); down is good (green). */
export function compute_spending_change(
  current_sen: number,
  previous_sen: number,
): SpendingChange {
  if (previous_sen === 0) {
    return { pct: 0, direction: "flat", label: "No prior month data" };
  }
  const pct = ((current_sen - previous_sen) / previous_sen) * 100;
  const rounded = Math.abs(pct).toFixed(1);
  if (Math.abs(pct) < 0.05) {
    return { pct: 0, direction: "flat", label: "Unchanged vs. previous month" };
  }
  if (pct > 0) {
    return {
      pct,
      direction: "up",
      label: `${rounded}% higher vs. previous month`,
    };
  }
  return {
    pct,
    direction: "down",
    label: `${rounded}% lower vs. previous month`,
  };
}