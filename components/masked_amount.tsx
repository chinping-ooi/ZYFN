import { format_rm } from "@/lib/money";
import type { MinorAmount } from "@/lib/money";
import { masked_amount_display } from "@/lib/hooks/hide_amounts_storage";

export function MaskedAmount({
  amounts_hidden,
  amount_sen,
  className = "",
}: {
  amounts_hidden: boolean;
  amount_sen: MinorAmount;
  className?: string;
}) {
  const text = masked_amount_display(amounts_hidden, format_rm(amount_sen));
  return (
    <span className={className} data-masked={amounts_hidden ? "true" : "false"}>
      {text}
    </span>
  );
}