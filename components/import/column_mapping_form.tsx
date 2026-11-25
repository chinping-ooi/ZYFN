"use client";

import type { SpreadsheetColumnMapping } from "@/lib/import/types";

type Props = {
  headers: string[];
  mapping: SpreadsheetColumnMapping;
  on_change: (mapping: SpreadsheetColumnMapping) => void;
};

function MappingSelect({
  label,
  value,
  headers,
  optional,
  on_change,
}: {
  label: string;
  value: string | undefined;
  headers: string[];
  optional?: boolean;
  on_change: (value: string | undefined) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px] text-zyfn-ink">
      <span className="font-medium text-slate-600">
        {label}
        {optional ? " (optional)" : ""}
      </span>
      <select
        className="h-9 rounded-[3px] border border-zyfn-line bg-white px-2"
        value={value ?? ""}
        onChange={(e) =>
          on_change(e.target.value ? e.target.value : undefined)
        }
      >
        {optional ? <option value="">—</option> : null}
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ColumnMappingForm({ headers, mapping, on_change }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <MappingSelect
        label="Date"
        value={mapping.date}
        headers={headers}
        on_change={(date) => on_change({ ...mapping, date: date ?? "" })}
      />
      <MappingSelect
        label="Description"
        value={mapping.description}
        headers={headers}
        on_change={(description) =>
          on_change({ ...mapping, description: description ?? "" })
        }
      />
      <MappingSelect
        label="Detail"
        value={mapping.detail}
        headers={headers}
        optional
        on_change={(detail) => on_change({ ...mapping, detail })}
      />
      <MappingSelect
        label="Type"
        value={mapping.txn_type}
        headers={headers}
        optional
        on_change={(txn_type) => on_change({ ...mapping, txn_type })}
      />
      <MappingSelect
        label="Debit / withdrawal"
        value={mapping.debit}
        headers={headers}
        optional
        on_change={(debit) => on_change({ ...mapping, debit })}
      />
      <MappingSelect
        label="Credit / deposit"
        value={mapping.credit}
        headers={headers}
        optional
        on_change={(credit) => on_change({ ...mapping, credit })}
      />
      <MappingSelect
        label="Balance"
        value={mapping.balance}
        headers={headers}
        optional
        on_change={(balance) => on_change({ ...mapping, balance })}
      />
    </div>
  );
}