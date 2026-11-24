export function NoDataSourcePanel({ area }: { area: string }) {
  return (
    <section className="rounded-[3px] border border-zyfn-line bg-white px-8 py-12 text-center">
      <h2 className="m-0 text-lg font-semibold">No data source yet</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-zyfn-muted">
        {area} is not connected to <code className="text-xs">Transaction.xlsx</code>{" "}
        in this build. Only the HLB and PBE sheets are loaded today.
      </p>
    </section>
  );
}