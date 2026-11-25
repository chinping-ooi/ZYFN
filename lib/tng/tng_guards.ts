import type { ParsedTngDump, TngLoadResult } from "@/lib/tng/types";

export function is_tng_data(result: TngLoadResult): result is ParsedTngDump {
  return "rows" in result;
}