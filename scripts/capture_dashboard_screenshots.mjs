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
  { name: "390x844", width: 390, height: 844, allow_scroll: true },
  { name: "820x1180", width: 820, height: 1180, allow_scroll: true },
  { name: "1024x485", width: 1024, height: 485, allow_scroll: true },
  { name: "1024x600", width: 1024, height: 600, allow_scroll: true },
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

const MEASURE_FN = `() => {
  const footer =
    document.querySelector(".workspace > footer") ??
    document.querySelector("footer");
  const footerTop = footer?.getBoundingClientRect().top ?? window.innerHeight;
  const bal = [...document.querySelectorAll("section")].find(
    (s) =>
      s.querySelector("h3")?.textContent === "Account balances" &&
      s.offsetParent !== null &&
      getComputedStyle(s).display !== "none",
  );
  const rows = bal
    ? [...bal.querySelectorAll("div")].filter(
        (d) =>
          d.className.includes("border-b") ||
          (d.className.includes("last") && d.className.includes("border")),
      )
    : [];
  const fd =
    rows.find((r) => r.textContent?.includes("Fixed deposits")) ??
    rows[rows.length - 1];
  const layout = document.querySelector(".dashboard-layout");
  const rightCol = layout?.children[1];
  const rightVisible = rightCol
    ? getComputedStyle(rightCol).display !== "none"
    : false;
  return {
    footerTop,
    fdBottom: fd?.getBoundingClientRect().bottom ?? 0,
    layoutBottom: layout?.getBoundingClientRect().bottom ?? 0,
    twoCol: layout && getComputedStyle(layout).flexDirection === "row",
    rightVisible,
  };
}`;

async function verifyDashboard(page, vp) {
  const main = page.locator("main.content");
  const issues = [];

  await main.evaluate((node) => {
    node.scrollTop = 0;
  });
  await delay(100);

  const metrics = await page.evaluate(new Function(`return (${MEASURE_FN})();`));
  const detail = await page.evaluate(() => {
    const mainEl = document.querySelector("main.content");
    const head = [...document.querySelectorAll(".dashboard-card-head")].find((h) =>
      h.textContent?.includes("Monthly cash flow"),
    );
    const legend = head?.querySelector(".whitespace-nowrap");
    const months = [...document.querySelectorAll(".plot span.whitespace-nowrap")].filter(
      (s) => /^[A-Z][a-z]{2}$/.test(s.textContent?.trim() ?? ""),
    );
    const yLabels = document.querySelector(".plot > div:first-child");
    const yWrap = yLabels
      ? [...yLabels.querySelectorAll("span")].some((s) => s.offsetHeight > 14)
      : false;
    return {
      mainOverflowHidden: mainEl && getComputedStyle(mainEl).overflowY === "hidden",
      chartHeadWrap:
        head &&
        legend &&
        legend.getBoundingClientRect().bottom > head.getBoundingClientRect().bottom + 2,
      monthClipped: months.some((m) => {
        const plot = m.closest(".plot");
        const pr = plot?.getBoundingClientRect();
        const mr = m.getBoundingClientRect();
        return pr && mr.bottom > pr.bottom + 1;
      }),
      yWrap,
    };
  });
  Object.assign(metrics, detail);

  if (metrics.mainOverflowHidden) {
    issues.push(`${vp.name}: main.content overflow-y is hidden`);
  }
  if (metrics.chartHeadWrap) {
    issues.push(`${vp.name}: chart legend wrapped below title`);
  }
  if (metrics.monthClipped) {
    issues.push(`${vp.name}: month label clipped in plot`);
  }
  if (metrics.yWrap) {
    issues.push(`${vp.name}: y-axis label wrapped`);
  }

  if (vp.width < 1024 && metrics.twoCol) {
    issues.push(`${vp.name}: expected single column below lg`);
  }
  if (vp.width >= 1024 && !metrics.rightVisible) {
    issues.push(`${vp.name}: expected two-column layout at lg`);
  }

  const footer_margin = 2;

  const ensureFdReachable = async () => {
    if (metrics.fdBottom <= metrics.footerTop - footer_margin) return true;
    await main.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await delay(150);
    const after = await page.evaluate(new Function(`return (${MEASURE_FN})();`));
    const in_viewport =
      after.fdBottom > 0 &&
      after.fdBottom <= after.footerTop - footer_margin &&
      after.fdBottom <= (await page.evaluate(() => window.innerHeight)) - 4;
    return in_viewport;
  };

  if (vp.allow_scroll) {
    if (!(await ensureFdReachable())) {
      issues.push(`${vp.name}: fixed deposits row not reachable by scroll`);
    }
  } else {
    if (metrics.fdBottom > metrics.footerTop - footer_margin) {
      issues.push(
        `${vp.name}: fixed deposits clipped (bottom ${Math.round(metrics.fdBottom)} > footer ${Math.round(metrics.footerTop)})`,
      );
    }
    if (metrics.layoutBottom > metrics.footerTop + 8) {
      issues.push(
        `${vp.name}: dashboard extends well past footer (layout ${Math.round(metrics.layoutBottom)})`,
      );
    }
  }

  const n = await page
    .locator("section")
    .filter({ has: page.locator("h3", { hasText: "Account balances" }) })
    .first()
    .locator("div.border-b, div.py-1")
    .count();
  if (n < 5) {
    issues.push(`${vp.name}: expected ≥5 balance rows, saw ${n}`);
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

    await page.locator("main.content").evaluate((node) => {
      node.scrollTop = 0;
    });
    await delay(80);

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