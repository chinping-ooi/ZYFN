import { AppShell } from "@/components/app_shell";
import { TngWalletPage, type ServerTngPayload } from "@/components/tng_wallet_page";
import { tng_reconcile_enabled } from "@/lib/tng/config";
import { load_tng_data } from "@/lib/tng/load";
import { is_tng_data } from "@/lib/tng/tng_guards";

export const dynamic = "force-dynamic";

export default function TngPage() {
  const tng = load_tng_data();

  const server: ServerTngPayload = is_tng_data(tng)
    ? { kind: "available", dump: tng }
    : { kind: "unavailable" };

  return (
    <AppShell
      title="TNG"
      description="Touch ’n Go eWallet · data.txt"
      footer_note="TNG + GO+ from data.txt · MYR"
    >
      <TngWalletPage
        server={server}
        reconcile_enabled={tng_reconcile_enabled()}
      />
    </AppShell>
  );
}