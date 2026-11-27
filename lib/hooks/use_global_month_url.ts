"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useGlobalMonthUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const set_month_param = useCallback(
    (value: string | "all") => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.set("month", "all");
      } else {
        params.set("month", value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return {
    query_month: searchParams.get("month"),
    set_month_param,
  };
}