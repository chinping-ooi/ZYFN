import { afterEach, describe, expect, it, vi } from "vitest";
import { mbb_2_gold_shared_limit_sen } from "@/lib/credit_cards/mbb_2_gold_limit";

describe("mbb_2_gold_shared_limit_sen", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_MBB_2_GOLD_CREDIT_LIMIT_SEN", "");
    vi.stubEnv("NEXT_PUBLIC_MBB_2_GOLD_CREDIT_LIMIT_MAJOR", "");
    expect(mbb_2_gold_shared_limit_sen()).toBeNull();
  });

  it("reads major from env", () => {
    vi.stubEnv("NEXT_PUBLIC_MBB_2_GOLD_CREDIT_LIMIT_MAJOR", "12000");
    expect(mbb_2_gold_shared_limit_sen()).toBe(1_200_000);
  });
});