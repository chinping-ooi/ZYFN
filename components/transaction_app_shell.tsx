import { AppShell } from "@/components/app_shell";

/** App shell for account statement routes (main content scroll). */
export function TransactionAppShell({
  title,
  children,
  last_updated,
  viewport_lock = true,
}: {
  title: string;
  children: React.ReactNode;
  last_updated?: string | null;
  /** Tighter main padding when viewport_lock is set (dashboard, import, statements). */
  viewport_lock?: boolean;
}) {
  return (
    <AppShell title={title} last_updated={last_updated} viewport_lock={viewport_lock}>
      {children}
    </AppShell>
  );
}