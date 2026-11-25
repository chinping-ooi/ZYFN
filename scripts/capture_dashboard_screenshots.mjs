/**
 * Capture dashboard layout screenshots and verify key UI is visible or scrollable.
 * Usage: SMOKE_BASE_URL=http://127.0.0.1:3001 SKIP_DEV_START=1 node scripts/capture_dashboard_screenshots.mjs
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
  { name: "1024x576", width: 1024, height: 576, allow_scroll: true },
  { name: "1366x768", width: 1366, height: 768, allow_scroll: false },
  { name: "1920x1080", width: 1920, height: 1080, allow_scroll: false },
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

async function verifyDashboard(page, vp) {
  const main = page.locator("main.content");
  const issues = [];

  await main.evaluate((node) => {
    node.scrollTop = 0;
  });
  await delay(100);

  const metrics = await page.evaluate(() => {
    const footer = document.querySelector("footer");
    const layout = document.querySelector(".dashboard-layout");
    const mainEl = document.querySelector("main.content");
    const bal = [...document.querySelectorAll("section")].find(
      (s) => s.querySelector("h3")?.textContent === "Account balances",
    );
    const fd = bal?.querySelector("div:last-child");
    const spendTotal = [...document.querySelectorAll("section")]
      .find((s) => s.querySelector("h3")?.textContent === "Spending breakdown")
      ?.querySelector(".border-t.border-zyfn-line");
    return {
      footerTop: footer?.getBoundingClientRect().top ?? 0,
      layoutBottom: layout?.getBoundingClientRect().bottom ?? 0,
      fdBottom: fd?.getBoundingClientRect().bottom ?? 0,
      spendTotalBottom: spendTotal?.getBoundingClientRect().bottom ?? 0,
      mainOverflowHidden:
        mainEl && getComputedStyle(mainEl).overflowY === "hidden",
      chartHeadWrap: (() => {
        const head = [...document.querySelectorAll(".dashboard-card-head")].find(
          (h) => h.textContent?.includes("Monthly cash flow"),
        );
        const legend = head?.querySelector(".whitespace-nowrap");
        if (!head || !legend) return false;
        return legend.getBoundingClientRect().bottom > head.getBoundingClientRect().bottom + 2;
      })(),
    };
  });

  if (metrics.mainOverflowHidden) {
    issues.push(`${vp.name}: main.content overflow-y is hidden`);
  }

  if (metrics.chartHeadWrap) {
    issues.push(`${vp.name}: chart legend wrapped below title`);
  }

  const footer_margin = 1;
  if (!vp.allow_scroll) {
    if (metrics.layoutBottom > metrics.footerTop - footer_margin) {
      issues.push(
        `${vp.name}: dashboard extends past footer (${Math.round(metrics.layoutBottom)} > ${Math.round(metrics.footerTop)})`,
      );
    }
    if (metrics.fdBottom > metrics.footerTop - footer_margin) {
      issues.push(
        `${vp.name}: fixed deposits row clipped (bottom ${Math.round(metrics.fdBottom)})`,
      );
    }
  } else {
    if (metrics.fdBottom > metrics.footerTop - footer_margin) {
      await main.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await delay(150);
      const after = await page.evaluate(() => {
        const footer = document.querySelector("footer");
        const bal = [...document.querySelectorAll("section")].find(
          (s) => s.querySelector("h3")?.textContent === "Account balances",
        );
        const fd = bal?.querySelector("div:last-child");
        return { fdBottom: fd?.getBoundingClientRect().bottom ?? 0, footerTop: footer?.getBoundingClientRect().top ?? 0 };
      });
      if (after.fdBottom > after.footerTop) {
        issues.push(`${vp.name}: fixed deposits row not reachable by scroll`);
      }
    }
  }

  const balance_rows = await page
    .locator("section")
    .filter({ has: page.locator("h3", { hasText: "Account balances" }) })
    .locator("div.border-b, div.last\\:border-0");
  const n = await balance_rows.count();
  if (n < 5) {
    issues.push(`${vp.name}: expected 5 balance rows, saw ${n}`);
  }

  return issues;
}

async function capture() {
  mkdirSync(out_dir, { recursive: true });
  const browser = await chromium.launch();
  const all_issues = [];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.waitForSelector(".dashboard-layout");

    const issues = await verifyDashboard(page, vp);
    all_issues.push(...issues);

    await page.screenshot({
      path: join(out_dir, `dashboard-${vp.name}.png`),
      fullPage: false,
    });

    if (vp.allow_scroll) {
      await page.locator("main.content").evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await delay(150);
      await page.screenshot({
        path: join(out_dir, `dashboard-${vp.name}-scrolled.png`),
        fullPage: false,
      });
    }

    await page.close();
  }

  await browser.close();
  return all_issues;
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