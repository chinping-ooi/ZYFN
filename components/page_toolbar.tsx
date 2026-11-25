import type { ReactNode } from "react";

export function PageToolbar({
  title,
  subtitle,
  controls,
}: {
  title: string;
  subtitle?: ReactNode;
  controls?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
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