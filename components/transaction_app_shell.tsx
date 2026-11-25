import { AppShell } from "@/components/app_shell";

/** App shell for account statement routes — locks viewport; table scrolls inside. */
export function TransactionAppShell({
  title,
  children,
  last_updated,
}: {
  title: string;
  children: React.ReactNode;
  last_updated?: string | null;
}) {
  return (
    <AppShell title={title} last_updated={last_updated} viewport_lock>
      {children}
    </AppShell>
  );
}