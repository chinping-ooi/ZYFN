"use client";

import { usePathname } from "next/navigation";

function parse_account_view(pathname: string) {
  const on_statement = pathname.endsWith("/statement");
  const title =
    on_statement || pathname.endsWith("/statement")
      ? "Account statement"
      : pathname.includes("/summary") || !on_statement
        ? "Summary"
        : "Account statement";
  return title;
}

export function AccountViewLoadingHeader({
  title,
}: {
  title?: string;
}) {
  const pathname = usePathname();
  const heading = title ?? parse_account_view(pathname);

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 min-w-0 text-[17px] font-semibold">{heading}</h2>
    </div>
  );
}