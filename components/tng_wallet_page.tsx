"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { TngStatementView } from "@/components/tng_statement_view";
import { parse_tng_text } from "@/lib/tng/parse_text";
import type { ParsedTngDump } from "@/lib/tng/types";

export type ServerTngPayload =
  | { kind: "available"; dump: ParsedTngDump }
  | { kind: "unavailable" };

type ActiveSource =
  | { mode: "server"; dump: ParsedTngDump }
  | { mode: "device"; filename: string; dump: ParsedTngDump };

export function TngWalletPage({
  server,
  reconcile_enabled,
}: {
  server: ServerTngPayload;
  reconcile_enabled: boolean;
}) {
  const file_ref = useRef<HTMLInputElement>(null);
  const [device, set_device] = useState<{
    filename: string;
    dump: ParsedTngDump;
  } | null>(null);
  const [parse_error, set_parse_error] = useState<string | null>(null);
  const [reading, set_reading] = useState(false);

  const active: ActiveSource | null = useMemo(() => {
    if (device) {
      return { mode: "device", filename: device.filename, dump: device.dump };
    }
    if (server.kind === "available") {
      return { mode: "server", dump: server.dump };
    }
    return null;
  }, [device, server]);

  const source_label = active
    ? active.mode === "server"
      ? "Source: server file"
      : `Source: this device (${active.filename})`
    : "Source: none — choose a data.txt from this device";

  const pick_device_file = useCallback(() => {
    file_ref.current?.click();
  }, []);

  const on_file_change = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      set_parse_error(null);
      set_reading(true);
      try {
        const raw = await file.text();
        const dump = parse_tng_text(raw);
        set_device({ filename: file.name, dump });
      } catch (error) {
        set_parse_error(
          error instanceof Error ? error.message : "Could not parse file.",
        );
      } finally {
        set_reading(false);
      }
    },
    [],
  );

  const use_server_file = useCallback(() => {
    set_device(null);
    set_parse_error(null);
  }, []);

  const toolbar = (
    <section
      className="mb-5 flex flex-col gap-3 rounded-[3px] border border-zyfn-line bg-white px-5 py-4"
      aria-label="TNG data source"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="m-0 text-[13px] text-zyfn-muted" role="status">
          {source_label}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={file_ref}
            type="file"
            accept=".txt,text/plain"
            className="sr-only"
            aria-hidden
            onChange={on_file_change}
          />
          <button
            type="button"
            className="page-btn"
            disabled={reading}
            onClick={pick_device_file}
          >
            {reading ? "Reading…" : "Read from this device"}
          </button>
          {server.kind === "available" && device ? (
            <button
              type="button"
              className="page-btn"
              onClick={use_server_file}
            >
              Use server file
            </button>
          ) : null}
        </div>
      </div>
      {parse_error ? (
        <p className="m-0 text-sm text-zyfn-red" role="alert">
          {parse_error}
        </p>
      ) : null}
      {!active ? (
        <p className="m-0 text-sm text-zyfn-muted">
          No data.txt on this server. Pick your export file locally — it is
          parsed in this browser tab only and is not uploaded.
        </p>
      ) : null}
    </section>
  );

  if (!active) {
    return toolbar;
  }

  return (
    <>
      {toolbar}
      <TngStatementView dump={active.dump} reconcile_enabled={reconcile_enabled} />
    </>
  );
}