import { AppShell } from "@/components/app_shell";
import { TngStatementView } from "@/components/tng_statement_view";
import { load_tng_data } from "@/lib/tng/load";
import { is_tng_data, type TngError, type TngMissing } from "@/lib/tng/types";

export const dynamic = "force-dynamic";

function TngStatusPanel({ result }: { result: TngMissing | TngError }) {
  return (
    <section className="rounded-[3px] border border-zyfn-line bg-white px-8 py-10 text-center">
      <h2 className="m-0 text-lg font-semibold">
        {result.kind === "missing" ? "data.txt not found" : "Could not read data.txt"}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-zyfn-muted">{result.message}</p>
    </section>
  );
}

export default function TngPage() {
  const tng = load_tng_data();

  return (
    <AppShell
      title="TNG"
      description="Touch ’n Go eWallet · data.txt"
      footer_note="TNG + GO+ from data.txt · MYR"
    >
      {!is_tng_data(tng) ? (
        <TngStatusPanel result={tng} />
      ) : (
        <TngStatementView dump={tng} />
      )}
    </AppShell>
  );
}