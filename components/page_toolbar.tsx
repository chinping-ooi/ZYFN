import type { ReactNode } from "react";

export function PageToolbar({
  title,
  subtitle,
  controls,
  dense = false,
}: {
  title: string;
  subtitle?: ReactNode;
  controls?: ReactNode;
  /** Tighter spacing for viewport-locked dashboard. */
  dense?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${
        dense ? "mb-3 lg:mb-2" : "mb-5"
      }`}
    >
      <div>
        <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
        {subtitle ? (
          <p className="m-0 mt-[3px] text-[13px] text-zyfn-muted">{subtitle}</p>
        ) : null}
      </div>
      {controls}
    </div>
  );
}