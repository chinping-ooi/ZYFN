/**
 * Capture dashboard layout screenshots and verify viewport fit / internal scroll.
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
  { name: "390x844", width: 390, height: 844, lg: false },
  { name: "820x1180", width: 820, height: 1180, lg: false },
  { name: "1024x485", width: 1024, height: 485, lg: true },
  { name: "1024x600", width: 1024, height: 600, lg: true },
  { name: "1366x768", width: 1366, height: 768, lg: true },
  { name: "1920x1080", width: 1920, height: 1080, lg: true },
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
  const issues = [];
  const main = page.locator("main.content");

  await main.evaluate((node) => {
    node.scrollTop = 0;
  });
  await delay(80);

  const m = await page.evaluate(() => {
    const mainEl = document.querySelector("main.content");
    const footer =
      document.querySelector(".workspace > footer") ??
      document.querySelector("footer");
    const footerTop = footer?.getBoundingClientRect().top ?? window.innerHeight;
    const layout = document.querySelector(".dashboard-layout");
    const layoutBottom = layout?.getBoundingClientRect().bottom ?? 0;

    const spendSection = [...document.querySelectorAll("section")].find(
      (s) =>
        s.querySelector("h3")?.textContent === "Spending breakdown" &&
        s.offsetParent !== null,
    );
    const spendTotal = spendSection?.querySelector(
      ".border-t.border-zyfn-line.bg-\\[\\#fafbfc\\]",
    );
    const spendList = spendSection?.querySelector(".accounts");

    const balSection = [...document.querySelectorAll("section")].find(
      (s) =>
        s.querySelector("h3")?.textContent === "Account balances" &&
        s.offsetParent !== null,
    );
    const balCardBottom = balSection?.getBoundingClientRect().bottom ?? 0;
    const balList = balSection?.querySelector(".balance-rows");

    const visiblePlot = [...document.querySelectorAll(".plot")].find(
      (p) => p.offsetParent !== null,
    );
    const chartFootEl = [...document.querySelectorAll(".chart-summary-footer")].find(
      (el) => el.offsetParent !== null,
    );
    const yAxis = visiblePlot?.querySelector(":scope > div:first-child");
    const yRects = yAxis
      ? [...yAxis.querySelectorAll("span")].map((s) => s.getBoundingClientRect())
      : [];
    let yOverlap = false;
    for (let i = 1; i < yRects.length; i++) {
      if (yRects[i - 1].bottom > yRects[i].top + 1) yOverlap = true;
    }
    const plotEl = visiblePlot;
    const plotH = plotEl?.getBoundingClientRect().height ?? 0;

    const fdRow = balList
      ? [...balList.children].find((c) => c.textContent?.includes("Fixed deposits"))
      : null;

    return {
      footerTop,
      layoutBottom,
      mainScroll: mainEl?.scrollHeight ?? 0,
      mainClient: mainEl?.clientHeight ?? 0,
      mainOverflowY: mainEl ? getComputedStyle(mainEl).overflowY : "",
      spendTotalBottom: spendTotal?.getBoundingClientRect().bottom ?? 0,
      spendTotalTop: spendTotal?.getBoundingClientRect().top ?? 0,
      chartFootBottom: chartFootEl?.getBoundingClientRect().bottom ?? 0,
      chartFootHeight: chartFootEl?.getBoundingClientRect().height ?? 0,
      chartFootVisible: chartFootEl != null && chartFootEl.offsetParent !== null,
      yOverlap,
      yTickCount: yRects.length,
      plotH,
      balCardBottom,
      fdRowBottom: fdRow?.getBoundingClientRect().bottom ?? 0,
      fdInBalList: fdRow != null,
      spendListOverflow: spendList
        ? getComputedStyle(spendList).overflowY
        : "",
      spendListScrollable:
        spendList &&
        spendList.scrollHeight > spendList.clientHeight + 2,
      balListOverflow: balList ? getComputedStyle(balList).overflowY : "",
      balListScrollable:
        balList && balList.scrollHeight > balList.clientHeight + 2,
      twoCol:
        layout && window.getComputedStyle(layout).flexDirection === "row",
    };
  });

  if (vp.lg) {
    if (m.mainOverflowY !== "hidden") {
      issues.push(`${vp.name}: lg+ main should not page-scroll (overflow-y=${m.mainOverflowY})`);
    }
    if (m.mainScroll > m.mainClient + 2) {
      issues.push(
        `${vp.name}: lg+ main scrollHeight ${m.mainScroll} > client ${m.mainClient}`,
      );
    }
    if (!m.twoCol) {
      issues.push(`${vp.name}: expected two-column layout at lg`);
    }
    if (m.layoutBottom > m.footerTop + 2) {
      issues.push(
        `${vp.name}: layout below footer (${Math.round(m.layoutBottom)} > ${Math.round(m.footerTop)})`,
      );
    }
    if (m.balCardBottom > m.footerTop + 2) {
      issues.push(
        `${vp.name}: balances card below footer (${Math.round(m.balCardBottom)})`,
      );
    }
    if (m.spendTotalBottom > m.footerTop + 2 || m.spendTotalTop < 80) {
      issues.push(`${vp.name}: spending Total not pinned in viewport`);
    }
    if (!m.chartFootVisible || m.chartFootHeight < 8) {
      issues.push(`${vp.name}: chart footer missing or collapsed`);
    }
    if (m.chartFootBottom > m.footerTop + 2) {
      issues.push(`${vp.name}: chart footer below workspace footer`);
    }
    if (m.yOverlap) {
      issues.push(`${vp.name}: y-axis labels overlap`);
    }
    if (vp.lg && m.yTickCount > 3) {
      issues.push(`${vp.name}: expected 3 y-axis ticks on dashboard chart, saw ${m.yTickCount}`);
    }
    if (vp.lg && m.plotH > 0 && m.plotH < 115) {
      issues.push(`${vp.name}: plot too short (${Math.round(m.plotH)}px)`);
    }
    if (m.spendTotalBottom > m.footerTop - 4) {
      issues.push(
        `${vp.name}: spending Total touches footer (bottom ${Math.round(m.spendTotalBottom)} vs footer ${Math.round(m.footerTop)})`,
      );
    }
    if (m.fdRowBottom > m.footerTop + 2) {
      if (!m.balListScrollable || m.balListOverflow !== "auto") {
        issues.push(`${vp.name}: FD row clipped without internal list scroll`);
      }
    }
  } else {
    if (m.mainOverflowY === "hidden") {
      issues.push(`${vp.name}: below lg main should allow page scroll`);
    }
    if (!m.twoCol) {
      // single column OK
    } else {
      issues.push(`${vp.name}: expected single column below lg`);
    }
  }

  if (m.spendListScrollable && m.spendListOverflow !== "auto") {
    issues.push(`${vp.name}: spending list overflows but overflow-y is not auto`);
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

    if (!vp.lg) {
      await page.locator("main.content").evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await delay(120);
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