import { AppShell } from "@/components/app_shell";

/** App shell for account statement routes — locks viewport; table scrolls inside. */
export function TransactionAppShell({
  title,
  description,
  footer_note,
  children,
}: {
  title: string;
  description: string;
  footer_note?: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      title={title}
      description={description}
      footer_note={footer_note}
      viewport_lock
    >
      {children}
    </AppShell>
  );
}