/**
 * Smoke-test all app routes against `next dev` (no real workbook).
 * Usage: start dev with TRANSACTION_XLSX_PATH=fixtures/transaction_synthetic.xlsx
 * then: node scripts/smoke_dev_routes.mjs
 */
import { execSync, spawn } from "child_process";
import { setTimeout as delay } from "timers/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = join(root, "fixtures", "transaction_synthetic.xlsx");
const tng_fixture = join(root, "fixtures", "data_synthetic.txt");
const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const routes = [
  "/",
  "/transactions/hong-leong-bank",
  "/transactions/pbe",
  "/transactions/maybank",
  "/credit-cards/mbb-visa-1697",
  "/credit-cards/mbb-amex-8060",
  "/credit-cards/pbe-visa-4104",
  "/credit-cards/pbe-mastercard-6357",
  "/transactions/tng-ewallet",
  "/transactions/tng-go-plus",
  "/fixed-deposits",
  "/fixed-deposits/maybank",
  "/fixed-deposits/public-bank",
  "/fixed-deposits/hong-leong-bank",
  "/nope-404",
];

const must_include = {
  "/transactions/hong-leong-bank": "Search all columns",
  "/fixed-deposits": "Deposit register",
  "/fixed-deposits/maybank": "Deposit register",
};

let dev = null;

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(base);
      if (res.ok || res.status < 500) return;
    } catch {
      /* retry */
    }
    await delay(500);
  }
  throw new Error("Dev server did not become ready");
}

async function run() {
  if (!existsSync(fixture)) {
    await import("./generate_synthetic_workbook.mjs");
  }

  const ownDev = process.env.SMOKE_SKIP_DEV_START !== "1";
  if (ownDev) {
    try {
      execSync(`fuser -k ${new URL(base).port || 3000}/tcp 2>/dev/null || true`, {
        stdio: "ignore",
      });
    } catch {
      /* port may already be free */
    }
    await delay(500);
    dev = spawn("npm", ["run", "dev", "--", "-p", "3000"], {
      cwd: root,
      env: {
        ...process.env,
        TRANSACTION_XLSX_PATH: fixture,
        TNG_DATA_PATH: tng_fixture,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    await waitForServer();
  } else {
    await waitForServer();
  }

  let failed = false;
  for (const path of routes) {
    const res = await fetch(base + path);
    const html = await res.text();
    const bad =
      res.status >= 500 ||
      html.includes("Application error") ||
      html.includes("Table columns are not configured");
    const need = must_include[path];
    if (need && !html.includes(need)) {
      console.error(`FAIL ${path}: missing "${need}"`);
      failed = true;
      continue;
    }
    if (path === "/nope-404" && res.status !== 404) {
      console.error(`FAIL ${path}: expected 404 got ${res.status}`);
      failed = true;
      continue;
    }
    if (bad) {
      console.error(`FAIL ${path}: status=${res.status}`);
      failed = true;
    } else {
      console.log(`OK ${path} (${res.status})`);
    }
  }

  if (dev) dev.kill("SIGTERM");

  try {
    execSync("npm run smoke:tng-client-parse", {
      cwd: root,
      stdio: "inherit",
    });
  } catch {
    failed = true;
  }

  if (failed) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  if (dev) dev.kill("SIGTERM");
  process.exit(1);
});