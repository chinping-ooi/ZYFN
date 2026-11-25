const styles: Record<string, string> = {
  active: "bg-[#f1f7f4] text-[#35634f] border-[#bfd2c7]",
  due: "bg-[#faf6ec] text-[#805e23] border-[#decea9]",
  matured: "bg-[#f2f3f5] text-[#626c7a] border-[#cbd0d8]",
  new: "bg-[#f1f7f4] text-[#35634f] border-[#bfd2c7]",
  duplicate: "bg-[#f2f3f5] text-[#626c7a] border-[#cbd0d8]",
  "needs review": "bg-[#faf6ec] text-[#805e23] border-[#decea9]",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const style =
    styles[key] ?? "bg-[#f2f3f5] text-[#626c7a] border-[#cbd0d8]";
  return (
    <span
      className={`inline-block rounded-[2px] border px-[7px] py-[3px] text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}