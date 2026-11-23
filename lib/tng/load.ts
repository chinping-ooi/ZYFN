import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { unstable_noStore as noStore } from "next/cache";
import { parse_tng_dump } from "@/lib/tng/parse_dump";
import type { TngLoadResult } from "@/lib/tng/types";

export const TNG_DATA_FILE = "data.txt";

function tng_path(): string {
  const override = process.env.TNG_DATA_PATH?.trim();
  if (override) return override;
  return join(process.cwd(), TNG_DATA_FILE);
}

export function load_tng_data(): TngLoadResult {
  noStore();

  const path = tng_path();
  if (!existsSync(path)) {
    return {
      kind: "missing",
      message:
        "data.txt was not found. Set TNG_DATA_PATH or place data.txt at the repository root.",
    };
  }

  try {
    const raw = readFileSync(path, "utf8");
    return parse_tng_dump(raw);
  } catch (error) {
    return {
      kind: "error",
      message:
        error instanceof Error ? error.message : "Could not read data.txt.",
    };
  }
}