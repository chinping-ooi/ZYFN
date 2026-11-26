import { AppShell } from "@/components/app_shell";
import { ImportWizard } from "@/components/import/import_wizard";

export default function ImportPage() {
  return (
    <AppShell title="Import" viewport_lock>
      <ImportWizard />
    </AppShell>
  );
}