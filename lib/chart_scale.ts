import { major_to_minor } from "@/lib/money";

/** Derive a pleasant Y-axis max from income and spending series (not a fixed 8000). */

export function chart_axis_max(values_sen: number[]): number {
  const peak = Math.max(0, ...values_sen);
  if (peak === 0) return major_to_minor(1000);
  const major = peak / 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(major)));
  const normalized = major / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  const axis_major = nice * magnitude;
  return Math.round(axis_major * 100);
}

export function axis_labels(max_sen: number, steps = 4): string[] {
  const labels: string[] = [];
  for (let i = steps; i >= 0; i--) {
    const value = (max_sen / steps) * i;
    labels.push(format_axis_tick(value));
  }
  return labels;
}

/** Three ticks (max, mid, 0) for compact dashboard plots. */
export function axis_labels_compact(max_sen: number): string[] {
  return axis_labels(max_sen, 2);
}

function format_axis_tick(sen: number): string {
  const major = sen / 100;
  const unit = (value: string) => `RM\u00a0${value}`;
  if (major >= 1000) {
    const k = major / 1000;
    return k % 1 === 0 ? unit(`${k}k`) : unit(`${k.toFixed(1)}k`);
  }
  if (major === 0) return "0";
  return unit(String(Math.round(major)));
}