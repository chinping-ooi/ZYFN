"use client";

import { usePathname } from "next/navigation";
import { AccountViewToggle } from "@/components/account_view_toggle";
import { Skeleton } from "@/components/ui/skeleton";

function parse_account_view(pathname: string) {
  const on_statement = pathname.endsWith("/statement");
  const base = on_statement
    ? pathname.slice(0, -"/statement".length)
    : pathname;
  return {
    base,
    active: on_statement ? ("statement" as const) : ("summary" as const),
  };
}

export function AccountViewLoadingHeader({
  title,
}: {
  title?: string;
}) {
  const pathname = usePathname();
  const { base, active } = parse_account_view(pathname);
  const heading =
    title ?? (active === "statement" ? "Account statement" : "Summary");
  const show_tng_controls = pathname.includes("/transactions/touch-n-go");

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 min-w-0 text-[17px] font-semibold">{heading}</h2>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {show_tng_controls ? (
          <Skeleton className="h-9 w-[11.5rem]" />
        ) : null}
        <Skeleton className="h-9 w-40" />
        <AccountViewToggle view_base_path={base} active_view={active} />
      </div>
    </div>
  );
}