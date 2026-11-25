/** Dropdown chevron — matches sidebar nav group indicator. */
export function SelectChevron({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute top-1/2 right-3.5 h-1.5 w-1.5 -translate-y-1/2 -rotate-45 border-r border-b border-current ${className}`}
      aria-hidden
    />
  );
}