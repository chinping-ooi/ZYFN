import { parse_tng_dump } from "@/lib/tng/import/parse_dump";
import type { ParsedTngDump } from "@/lib/tng/import/types";

/** Parse raw data.txt text in the browser or Node (no filesystem). */
export function parse_tng_text(raw: string): ParsedTngDump {
  return parse_tng_dump(raw);
}