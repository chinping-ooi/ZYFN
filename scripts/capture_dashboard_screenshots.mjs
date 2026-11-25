/**
 * Capture dashboard layout screenshots at fixed viewports (Playwright).
 * Usage: SMOKE_BASE_URL=http://127.0.0.1:3001 node scripts/capture_dashboard_screenshots.mjs
 *
 * Starts `next dev` on port 3000 when no server responds (optional SKIP_DEV_START=1).
 */
import { execSync, spawn } from "child_process";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { setTimeout as delay } from "timers/promises";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const out_dir =
  process.env.DASHBOARD_SCREENSHOT_DIR ??
  join("/opt/cursor/artifacts", "dashboard-layout");
const path = "/preview/dashboard";

const viewports = [
  { name: "1024x576", width: 1024, height: 576 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

let dev = null;

async function serverReady() {
  try {
    const res = await fetch(`${base}${path}`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    if (await serverReady()) return;
    await delay(500);
  }
  throw new Error("Dev server did not become ready");
}

async function capture() {
  mkdirSync(out_dir, { recursive: true });
  const browser = await chromium.launch();
  const issues = [];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.waitForSelector(".dashboard-layout");

    const layout_box = await page.locator(".dashboard-layout").boundingBox();
    const left_col = page.locator(".dashboard-layout > div").first();
    const kpi = left_col.locator('[aria-label="Monthly financial summary"]');
    const spending = left_col.locator("section").first();

    const kpi_box = await kpi.boundingBox();
    const spend_box = await spending.boundingBox();

    if (kpi_box && spend_box) {
      const gap = spend_box.y - (kpi_box.y + kpi_box.height);
      if (gap > 48) {
        issues.push(`${vp.name}: KPI→spending gap ${Math.round(gap)}px (>48)`);
      }
    }

    const overflow_x = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    if (overflow_x) issues.push(`${vp.name}: horizontal overflow`);

    const y_labels = await page.locator('[class*="cash-flow"] .y-label, .cash-flow-chart .tabular-nums').allTextContents();
    for (const t of y_labels) {
      if (t.includes("\n") || (t.length > 12 && t.includes(" "))) {
        issues.push(`${vp.name}: possible wrapped y-label: ${t.slice(0, 30)}`);
      }
    }

    await page.screenshot({
      path: join(out_dir, `dashboard-${vp.name}.png`),
      fullPage: false,
    });

    if (layout_box) {
      console.log(`${vp.name}: dashboard-layout ${Math.round(layout_box.width)}×${Math.round(layout_box.height)}`);
    }
    await page.close();
  }

  await browser.close();
  return issues;
}

async function main() {
  const skip_start = process.env.SKIP_DEV_START === "1";

  if (!skip_start && !(await serverReady())) {
    try {
      execSync("fuser -k 3000/tcp", { stdio: "ignore" });
    } catch {
      // ignore
    }
    dev = spawn("npm", ["run", "dev", "--", "-p", "3000"], {
      cwd: root,
      stdio: "ignore",
      env: { ...process.env },
    });
    await waitForServer();
  } else if (!(await serverReady())) {
    throw new Error(`Server not ready at ${base}${path}`);
  }

  const issues = await capture();

  if (dev) dev.kill("SIGTERM");

  if (issues.length > 0) {
    console.warn("Layout checks reported issues:");
    for (const i of issues) console.warn(`  - ${i}`);
    process.exitCode = 2;
  }

  console.log(`Screenshots saved under ${out_dir}`);
}

main().catch((err) => {
  console.error(err);
  if (dev) dev.kill("SIGTERM");
  process.exit(1);
});