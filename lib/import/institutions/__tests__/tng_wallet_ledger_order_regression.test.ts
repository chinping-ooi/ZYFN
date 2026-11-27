import { describe, expect, it } from "vitest";
import { parse_tng_wallet_statement } from "@/lib/import/parsers/tng_wallet";
import { validate_running_balance } from "@/lib/import/institutions/tng_wallet/validate";

/**
 * Synthetic statement in the pdfjs line shape of the TNG transaction history:
 * each section is oldest-first top-down, GO+ balances are printed at 2dp while
 * interest is 4dp, eWallet "Quick Reload Payment (via GO+" rows imply GO+
 * outflows that the GO+ section does not print, and "eWallet Cash Out" moves
 * the eWallet balance into GO+ ("GO+ Cash In").
 */
const FIXTURE = `
TNG WALLET TRANSACTION HISTORY
Transaction Period 1 October 2026 - 15 October 2026
TNG WALLET TRANSACTION
Date Status Transaction Type Reference Description Details Amount (RM) Wallet Balance
3/10/2026 Success Reload 5001 Quick Reload Payment (via GO+   990000000000000001 RM3.00 RM3.40
Balance) SYNTHREF
3/10/2026 Success RFID Payment 5002 SYNTH TOLL 03/10/2026 04:15 PM RM3.00 RM0.40
3/10/2026 Success DUITNOW_RECEI  5003 SAMPLE SENDER 990000000000000003   RM20.00 RM20.40
VEFROM   5003B
3/10/2026 Success eWallet Cash Out 5004 Via eWallet to GO+ 990000000000000004 RM20.40 RM0.00
3/10/2026 Success Reload 5005 Quick Reload Payment (via GO+   990000000000000005 RM5.00 RM5.00
Balance) SYNTHREF
3/10/2026 Success Payment 5006 SAMPLE SHOP 990000000000000006   RM5.00 RM0.00
4/10/2026 Success Reload 5007 Quick Reload Payment (via GO+   990000000000000007 RM1.10 RM1.10
Balance) SYNTHREF
4/10/2026 Success Payment 5008 SAMPLE CAFE 990000000000000008   RM1.10 RM0.00
4/10/2026 Success Receive from Wallet5009 SAMPLE FRIEND 990000000000000009   RM2.00 RM2.00
GO+ TRANSACTION
Date Status Transaction Type Reference Description Details Amount (RM) GO+ Balance
3/10/2026 Success GO+ Daily Earnings SYNMMF01 Daily Interest 990000000000000101 RM0.0007 RM10.00
3/10/2026 Success GO+ Cash In SYNMMF02 Via eWallet to GO+ 990000000000000102 RM20.40 RM27.40
4/10/2026 Success GO+ Daily Earnings SYNMMF03 Daily Interest 990000000000000103 RM0.0009 RM22.40
5/10/2026 Success GO+ Daily Earnings SYNMMF04 Daily Interest 990000000000000104 RM0.0008 RM21.30
`;

describe("tng_wallet ledger order (oldest-first) and GO+ reconciliation", () => {
  const { rows } = parse_tng_wallet_statement(FIXTURE);
  const wallet = rows.filter((r) => r.account_ref === "TNG_EWALLET");
  const go = rows.filter((r) => r.account_ref === "TNG_GO_PLUS");

  it("keeps every printed row, including eWallet Cash Out", () => {
    expect(wallet).toHaveLength(9);
    expect(go.filter((r) => !r.review_reasons.includes("Derived from eWallet reload"))).toHaveLength(4);
    expect(go.filter((r) => r.review_reasons.includes("Derived from eWallet reload"))).toHaveLength(3);
    const cash_out = wallet.find((r) => r.detail === "5004");
    expect(cash_out?.direction).toBe("out");
    expect(cash_out?.balance_after_major).toBe("0.00");
  });

  it("assigns directions from the top-down balance chain", () => {
    const by_ref = (ref: string) => wallet.find((r) => r.detail === ref);
    expect(by_ref("5001")?.direction).toBe("in");
    expect(by_ref("5002")?.direction).toBe("out");
    expect(by_ref("5003")?.direction).toBe("in");
    expect(by_ref("5009")?.direction).toBe("in");
    const cash_in = go.find((r) => r.txn_type === "GO+ Cash In" || r.detail === "SYNMMF02");
    expect(cash_in?.direction).toBe("in");
  });

  it("interleaves derived GO+ outflows so printed GO+ balances reconcile", () => {
    const ordered = [...go].sort((a, b) => a.txn_at.localeCompare(b.txn_at));
    expect(ordered.map((r) => r.balance_after_major)).toEqual([
      "10.00",
      "7.00",
      "27.40",
      "22.40",
      "22.40",
      "21.30",
      "21.30",
    ]);
    expect(
      go.some((r) => r.review_reasons.some((x) => x.startsWith("GO+ balance gap"))),
    ).toBe(false);
  });

  it("validates both pockets with no balance mismatch", () => {
    validate_running_balance(wallet, "asset");
    validate_running_balance(go, "asset");
    for (const r of [...wallet, ...go]) {
      expect(r.review_reasons).not.toContain("Balance mismatch");
    }
    const unexplained = [...wallet, ...go].filter(
      (r) =>
        r.status === "needs_review" &&
        !r.review_reasons.every((x) => x === "Derived from eWallet reload"),
    );
    expect(unexplained).toEqual([]);
  });

  it("reads wrapped and glued type cells without leaking them into descriptions", () => {
    const duitnow = wallet.find((r) => r.detail === "5003");
    expect(duitnow?.txn_type).toBe("DUITNOW_RECEIVEFROM");
    expect(duitnow?.description).toContain("SAMPLE SENDER");
    expect(duitnow?.description).not.toMatch(/VEFROM|DUITNOW_RECEI/);
    const receive = wallet.find((r) => r.detail === "5009");
    expect(receive?.description).toContain("SAMPLE FRIEND");
    expect(receive?.description).not.toMatch(/Success|Receive from Wallet/);
  });

  it("stores the RFID time as Malaysia time and keeps the MYT calendar day", () => {
    const rfid = wallet.find((r) => r.detail === "5002");
    // 04:15 PM MYT = 08:15 UTC on the same day (not 16:15Z = next MYT day).
    expect(rfid?.txn_at).toBe("2026-10-03T08:15:00Z");
    const day = wallet.filter((r) => r.txn_at.startsWith("2026-10-03"));
    const times = day.map((r) => r.txn_at);
    expect(new Set(times).size).toBe(times.length);
  });
});