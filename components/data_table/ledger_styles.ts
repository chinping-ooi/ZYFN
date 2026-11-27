export const LEDGER_CELL_DIVIDER =
  "border-0 border-r border-b border-slate-200 last:border-r-0";

/** Horizontal scroll only; overflow-y-clip avoids implicit overflow-y:auto beside overflow-x:auto. */
export const LEDGER_TABLE_SCROLL_X =
  "overflow-x-auto overflow-y-clip overscroll-x-contain";

export const LEDGER_HEAD_CELL = `${LEDGER_CELL_DIVIDER} bg-[#edf0f4] shadow-[inset_0_1px_0_0_#e2e8f0,inset_0_-1px_0_0_#e2e8f0]`;

export const LEDGER_HEAD_CELL_SKELETON = `${LEDGER_CELL_DIVIDER} bg-[#edf0f4] shadow-[inset_0_1px_0_0_#e2e8f0,inset_0_-1px_0_0_#e2e8f0]`;