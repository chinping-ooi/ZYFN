import type { ReactNode } from "react";

export function CardHead({
  title,
  subtitle,
  aside,
  align = "start",
}: {
  title: string;
  subtitle?: ReactNode;
  aside?: ReactNode;
  align?: "start" | "center";
}) {
  return (
    <div
      className={`flex flex-wrap justify-between gap-3 border-b border-zyfn-line bg-[#fafbfc] px-5 py-4 ${
        align === "center" ? "items-center" : "items-start"
      }`}
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