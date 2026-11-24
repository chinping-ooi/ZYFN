/**
 * Wallet running-balance reconcile is ON HOLD (see lib/tng/reconcile.ts).
 * Set `TNG_RECONCILE_ENABLED=true` to surface warning counts in the UI while we
 * refine parser semantics against real data.txt.
 */
export function tng_reconcile_enabled(): boolean {
  const raw = process.env.TNG_RECONCILE_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}