"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SHOW_GO_PLUS,
  read_show_go_plus_pref,
  write_show_go_plus_pref,
} from "@/lib/hooks/show_go_plus_storage";

/** Client-only GO+ row visibility for the merged TNG statement page. */
export function useShowGoPlus() {
  const [show_go_plus, set_show] = useState(DEFAULT_SHOW_GO_PLUS);

  useEffect(() => {
    const stored = read_show_go_plus_pref();
    queueMicrotask(() => {
      set_show(stored);
    });
  }, []);

  const set_show_go_plus = useCallback((show: boolean) => {
    set_show(show);
    write_show_go_plus_pref(show);
  }, []);

  return { show_go_plus, set_show_go_plus };
}

/** @alias useShowGoPlus */
export const use_show_go_plus = useShowGoPlus;