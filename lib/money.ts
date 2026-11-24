/** Amounts are stored as integer minor units (sen) for MYR. */

export type CurrencyCode = "MYR";

export type MinorAmount = number;

export const CURRENCY: CurrencyCode = "MYR";

export function format_money(minor: MinorAmount): string {
  const major = minor / 100;
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}

export function format_rm(minor: MinorAmount): string {
  return `RM ${format_money(minor)}`;
}

export function major_to_minor(major: number): MinorAmount {
  return Math.round(major * 100);
}

export function minor_to_major(minor: MinorAmount): number {
  return minor / 100;
}