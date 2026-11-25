import type { NormalizedImportRow } from "@/lib/import/types";

export type BankParserDetectResult = {
  id: string;
  score: number;
};

export type StatementParser = {
  id: string;
  detect(text: string): BankParserDetectResult;
  parse(text: string): NormalizedImportRow[];
};