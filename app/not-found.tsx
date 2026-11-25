import Link from "next/link";
import { AppShell } from "@/components/app_shell";

export default function NotFound() {
  return (
    <AppShell title="Page not found">
      <section className="rounded-[3px] border border-zyfn-line bg-white px-8 py-12 text-center">
        <h2 className="m-0 text-lg font-semibold">404 — Not found</h2>
        <p className="mt-3 text-sm text-zyfn-muted">
          This route is not part of the ZYFN workspace. Use the sidebar or return
          to the dashboard.
        </p>
        <Link href="/" className="page-btn mt-6 inline-flex no-underline">
          Back to Dashboard
        </Link>
      </section>
    </AppShell>
  );
}