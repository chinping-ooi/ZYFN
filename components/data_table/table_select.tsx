import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export function TableSelect({
  className = "",
  wrapperClassName = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
}) {
  return (
    <span className={`relative inline-block ${wrapperClassName}`}>
      <select
        className={`w-full appearance-none rounded-[3px] border border-[#b8c2cf] bg-white pl-3 pr-10 text-sm text-zyfn-ink ${className}`}
        {...props}
      />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
        aria-hidden
      />
    </span>
  );
}