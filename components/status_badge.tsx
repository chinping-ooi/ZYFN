import type { FdStatus } from "@/lib/fd_status";
import { status_label } from "@/lib/fd_status";

const styles: Record<FdStatus, string> = {
  active: "bg-[#f1f7f4] text-[#35634f] border-[#bfd2c7]",
  due: "bg-[#faf6ec] text-[#805e23] border-[#decea9]",
  matured: "bg-[#f2f3f5] text-[#626c7a] border-[#cbd0d8]",
};

export function StatusBadge({ status }: { status: FdStatus }) {
  return (
    <span
      className={`inline-block rounded-[2px] border px-[7px] py-[3px] text-xs font-medium ${styles[status]}`}
    >
      {status_label(status)}
    </span>
  );
}