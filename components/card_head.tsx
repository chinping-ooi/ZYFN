import type { ReactNode } from "react";

export function CardHead({
  title,
  subtitle,
  aside,
  align = "start",
  className = "",
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={`dashboard-card-head flex shrink-0 flex-wrap justify-between gap-3 border-b border-zyfn-line bg-[#fafbfc] px-5 py-4 ${
        align === "center" ? "items-center" : "items-start"
      } min-h-[4.75rem] ${className}`}
    >
      <div>
        <h3 className="m-0 text-[15px] font-semibold">{title}</h3>
        {subtitle ? (
          <p className="sub m-0 mt-[3px] text-xs text-zyfn-muted">{subtitle}</p>
        ) : null}
      </div>
      {aside}
    </div>
  );
}