import type { WorkbookMissing, WorkbookError } from "@/lib/workbook/types";

export function WorkbookStatusPanel({
  result,
}: {
  result: WorkbookMissing | WorkbookError;
}) {
  return (
    <section className="rounded-[3px] border border-zyfn-line bg-white px-8 py-10 text-center">
      <h2 className="m-0 text-lg font-semibold">
        {result.kind === "missing"
          ? "Transaction.xlsx not found"
          : "Could not read Transaction.xlsx"}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-zyfn-muted">
        {result.message}
      </p>
    </section>
  );
}