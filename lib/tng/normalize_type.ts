/** Normalise TNG transaction type labels (no personal-name rules). */
export function normalize_tng_type(raw_type: string, description: string): string {
  const type = raw_type.trim();
  const lower = type.toLowerCase();
  const desc = description.toLowerCase();

  if (lower.includes("duitnow qr") || lower.includes("duitnow tng")) {
    return "DuitNow QR";
  }
  if (
    lower.includes("auto reload") ||
    lower.includes("balance top up") ||
    lower === "reload"
  ) {
    if (
      desc.includes("quick payment card") ||
      desc.includes("quick reload card")
    ) {
      return "Card Charge";
    }
    return "Reload";
  }
  if (lower === "fpx" || lower === "unknown") {
    return "FPX";
  }
  if (lower.includes("go+ daily")) {
    return "GO+ Daily Earnings";
  }
  if (lower.includes("go+ cash in")) {
    return "GO+ Cash In";
  }
  if (lower.includes("go+ cash out") || lower.includes("ewallet cash out")) {
    return "GO+ Cash Out";
  }
  if (lower === "payment" || lower.includes("paydirect")) {
    return "Payment";
  }
  return type || "Unknown";
}