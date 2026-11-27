import type { ComponentProps } from "react";

export function Skeleton({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`skeleton-shimmer rounded-[3px] ${className}`.trim()}
      aria-hidden
      {...props}
    />
  );
}