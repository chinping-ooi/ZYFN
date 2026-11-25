import type { ReactNode } from "react";

export function CardHead({
  title,
  subtitle,
  aside,
  align = "start",
  compact = false,
  table_shell = false,
  className = "",
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  align?: "start" | "center";
  /** Tighter padding for dashboard secondary cards. */
  compact?: boolean;
  /** Account table cards: compact title bar without subtitle min-height. */
  table_shell?: boolean;
  className?: string;
}) {
  const pad = table_shell
    ? "px-4 py-3"
    : compact
      ? "px-3 py-2.5 md:px-4 md:py-3"
      : "px-5 py-4";
  const min_h =
    table_shell || compact ? "min-h-0" : subtitle ? "min-h-0" : "min-h-[4.75rem]";
  const align_items =
    table_shell || align === "center" ? "items-center" : "items-start";

  return (
    <div
      className={`dashboard-card-head flex shrink-0 flex-wrap justify-between gap-3 border-b border-zyfn-line bg-[#fafbfc] ${pad} ${align_items} ${min_h} ${className}`}
    >
      <div className="min-w-0">
        <h3 className={`m-0 font-semibold ${compact ? "text-sm" : "text-[15px]"}`}>
          {title}
        </h3>
        {subtitle ? (
          <p
            className={`sub m-0 mt-0.5 truncate text-zyfn-muted ${
              compact ? "text-[10px] md:text-[11px]" : "text-xs"
            }`}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {aside}
    </div>
  );
}