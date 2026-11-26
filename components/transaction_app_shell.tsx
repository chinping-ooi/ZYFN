import { AppShell } from "@/components/app_shell";

/** App shell for account statement routes — locks viewport; table scrolls inside. */
export function TransactionAppShell({
  title,
  children,
  last_updated,
  viewport_lock = true,
}: {
  title: string;
  children: React.ReactNode;
  last_updated?: string | null;
  /** Statement table uses locked viewport; summary page scrolls. */
  viewport_lock?: boolean;
}) {
  return (
    <AppShell title={title} last_updated={last_updated} viewport_lock={viewport_lock}>
      {children}
    </AppShell>
  );
}