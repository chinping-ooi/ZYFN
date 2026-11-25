import type { ReactNode } from "react";
import { CardHead } from "@/components/card_head";

export function AccountTableCard({
  title,
  children,
  fill_height = false,
}: {
  title: string;
  children: ReactNode;
  fill_height?: boolean;
}) {
  return (
    <section
      className={`statement-table card flex min-h-0 flex-col overflow-hidden rounded-[3px] border border-zyfn-line bg-white ${
        fill_height ? "flex-1" : ""
      }`}
    >
      <CardHead title={title} />
      <div
        className={`flex min-h-0 flex-col ${fill_height ? "min-h-0 flex-1" : ""} px-5 pb-4`}
      >
        {children}
      </div>
    </section>
  );
}