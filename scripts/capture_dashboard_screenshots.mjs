/**
 * Dashboard layout screenshots + uniform gap verification.
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
const TOKEN_PX = 16;

const viewports = [
  { name: "390x844", width: 390, height: 844, lg: false },
  { name: "1024x564", width: 1024, height: 564, lg: true },
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

function assertUniformGaps(gaps, label, issues, vpName) {
  const uniq = [...new Set(gaps)];
  for (const g of gaps) {
    if (Math.abs(g - TOKEN_PX) > 1.5) {
      issues.push(
        `${vpName}: ${label} gap ${g}px ≠ ${TOKEN_PX}px (all: ${gaps.join(", ")})`,
      );
      return;
    }
  }
  if (uniq.length > 1) {
    issues.push(`${vpName}: ${label} gaps not uniform: ${gaps.join(", ")}`);
  }
}

async function verifyDashboard(page, vp) {
  const issues = [];
  const main = page.locator("main.content");

  await main.evaluate((node) => {
    node.scrollTop = 0;
  });
  await delay(80);
  if (vp.lg) {
    await page.waitForFunction(
      () => {
        const plot = [...document.querySelectorAll(".plot")].find(
          (p) => p.offsetParent !== null,
        );
        if (!plot) return false;
        const h = plot.clientHeight;
        const ticks = plot.querySelector(
          ":scope > div:first-child",
        )?.querySelectorAll("span").length;
        const want = h < 200 ? 3 : 5;
        return ticks === want;
      },
      { timeout: 8000 },
    );
  }

  const m = await page.evaluate((tokenPx) => {
    const shell = document.querySelector(".dashboard-shell");
    const kpiRow = document.querySelector(".dashboard-kpi-row");
    const body = document.querySelector(".dashboard-columns");
    const colLeft = document.querySelector(".dashboard-column-left");
    const colRight = document.querySelector(".dashboard-column-right");
    const mainEl = document.querySelector("main.dashboard-main");
    const footer =
      document.querySelector(".workspace > footer") ??
      document.querySelector("footer");
    const footerTop = footer?.getBoundingClientRect().top ?? 0;

    const measureRowGap = (row) => {
      if (!row || row.children.length < 2) return [];
      const g = getComputedStyle(row).gap;
      const gaps = [];
      const kids = [...row.children];
      if (window.innerWidth >= 1024 && row === body) {
        for (let i = 1; i < kids.length; i++) {
          const prev = kids[i - 1].getBoundingClientRect();
          const curr = kids[i].getBoundingClientRect();
          gaps.push(Math.round(curr.left - prev.right));
        }
      } else {
        for (let i = 1; i < kids.length; i++) {
          const prev = kids[i - 1].getBoundingClientRect();
          const curr = kids[i].getBoundingClientRect();
          gaps.push(Math.round(curr.top - prev.bottom));
        }
      }
      return { cssGap: g, gaps, token: tokenPx };
    };

    const shellGaps = measureRowGap(shell);
    const kpiGaps = measureRowGap(kpiRow);
    const bodyGaps = measureRowGap(body);

    const cells = body ? [...body.children] : [];
    const cellBottoms = cells.map((c) => c.getBoundingClientRect().bottom);
    const cellTops = cells.map((c) => c.getBoundingClientRect().top);
    const bodyBottom = body?.getBoundingClientRect().bottom ?? 0;

    const balCard = colRight?.querySelector(".balance-rows")?.closest(".card");
    const balList = colRight?.querySelector(".balance-rows");
    const balCardRect = balCard?.getBoundingClientRect();
    const balOverflow =
      balList && balCardRect
        ? [...balList.children].some((row) => {
            const r = row.getBoundingClientRect();
            return r.bottom > balCardRect.bottom + 1;
          })
        : false;

    const visiblePlot = [...document.querySelectorAll(".plot")].find(
      (p) => p.offsetParent !== null,
    );
    const yAxis = visiblePlot?.querySelector(":scope > div:first-child");
    const yRects = yAxis
      ? [...yAxis.querySelectorAll("span")].map((s) => s.getBoundingClientRect())
      : [];
    let yOverlap = false;
    for (let i = 1; i < yRects.length; i++) {
      if (yRects[i - 1].bottom > yRects[i].top + 1) yOverlap = true;
    }

    const chartFoot = [...document.querySelectorAll(".chart-summary-footer")].find(
      (el) => el.offsetParent !== null,
    );

    return {
      dashGapVar: getComputedStyle(document.documentElement).getPropertyValue(
        "--dash-gap",
      ),
      mainPaddingTop: mainEl
        ? Math.round(parseFloat(getComputedStyle(mainEl).paddingTop))
        : null,
      mainOverflow: mainEl ? getComputedStyle(mainEl).overflowY : "",
      mainScroll: mainEl?.scrollHeight ?? 0,
      mainClient: mainEl?.clientHeight ?? 0,
      shellGaps,
      kpiGaps,
      bodyGaps,
      bodyBottom,
      footerTop,
      cellBottoms,
      cellTops,
      topsAligned:
        cellTops.length > 1
          ? Math.max(...cellTops) - Math.min(...cellTops) <= 1
          : true,
      bottomsAligned:
        cellBottoms.length > 1
          ? Math.max(...cellBottoms) - Math.min(...cellBottoms) <= 1
          : true,
      yOverlap,
      yTickCount: yRects.length,
      chartFootVisible: chartFoot && chartFoot.getBoundingClientRect().height > 8,
      plotH: visiblePlot?.getBoundingClientRect().height ?? 0,
      shortViewport: window.innerHeight < 600,
      balOverflow,
      colLeftBottom: colLeft?.getBoundingClientRect().bottom ?? 0,
      colRightBottom: colRight?.getBoundingClientRect().bottom ?? 0,
    };
  }, TOKEN_PX);

  assertUniformGaps(m.shellGaps.gaps, "shell vertical", issues, vp.name);
  if (vp.lg && m.kpiGaps.cssGap) {
    const kpi_px = Math.round(parseFloat(m.kpiGaps.cssGap));
    if (Number.isFinite(kpi_px) && Math.abs(kpi_px - TOKEN_PX) > 1.5) {
      issues.push(`${vp.name}: KPI grid gap ${kpi_px}px ≠ ${TOKEN_PX}px`);
    }
  }
  if (vp.lg) {
    const kpiCount = await page.locator(".dashboard-kpi-row > .card").count();
    if (kpiCount !== 2) {
      issues.push(`${vp.name}: expected 2 KPI cards, saw ${kpiCount}`);
    }
  }
  if (vp.lg && m.bodyGaps.gaps.length > 0) {
    assertUniformGaps(m.bodyGaps.gaps, "body horizontal", issues, vp.name);
  }

  if (m.mainPaddingTop != null && Math.abs(m.mainPaddingTop - TOKEN_PX) > 1.5) {
    issues.push(`${vp.name}: main padding ${m.mainPaddingTop}px ≠ ${TOKEN_PX}px`);
  }

  if (vp.lg && !m.shortViewport) {
    if (m.mainOverflow !== "hidden") {
      issues.push(`${vp.name}: expected hidden main overflow at lg+ tall viewport`);
    }
    if (m.mainScroll > m.mainClient + 2) {
      issues.push(`${vp.name}: main scroll ${m.mainScroll} > ${m.mainClient}`);
    }
    const colDelta = Math.abs(m.colLeftBottom - m.colRightBottom);
    if (colDelta > 2) {
      issues.push(
        `${vp.name}: column bottoms misaligned by ${colDelta.toFixed(1)}px`,
      );
    }
    if (m.balOverflow) {
      issues.push(`${vp.name}: account balance rows overflow card border`);
    }
    if (m.bodyBottom > m.footerTop + 2) {
      issues.push(`${vp.name}: body below footer`);
    }
  }

  if (vp.lg && m.shortViewport && m.mainOverflow !== "auto") {
    issues.push(`${vp.name}: short lg viewport should allow page scroll`);
  }

  if (m.yOverlap) issues.push(`${vp.name}: y-axis labels overlap`);
  if (vp.lg && m.plotH >= 200 && m.yTickCount !== 5) {
    issues.push(`${vp.name}: tall plot expected 5 y ticks, saw ${m.yTickCount}`);
  }
  if (vp.lg && m.plotH > 0 && m.plotH < 200 && m.yTickCount !== 3) {
    issues.push(`${vp.name}: short plot expected 3 y ticks, saw ${m.yTickCount}`);
  }
  if (!m.chartFootVisible) issues.push(`${vp.name}: chart footer not visible`);

  const hasDonut = await page.locator(".spending-donut").count();
  if (hasDonut !== 1) {
    issues.push(`${vp.name}: expected 1 spending donut chart, saw ${hasDonut}`);
  }

  return { issues, gaps: m };
}

async function capture() {
  mkdirSync(out_dir, { recursive: true });
  const browser = await chromium.launch();
  const all_issues = [];
  const gap_report = {};

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.waitForSelector(".dashboard-shell");

    const { issues, gaps } = await verifyDashboard(page, vp);
    all_issues.push(...issues);
    gap_report[vp.name] = {
      shell: gaps.shellGaps.gaps,
      kpi: gaps.kpiGaps.gaps,
      body: gaps.bodyGaps.gaps,
      mainPadding: gaps.mainPaddingTop,
    };

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
  return { all_issues, gap_report };
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

  const { all_issues, gap_report } = await capture();

  if (dev) dev.kill("SIGTERM");

  console.log("Measured gaps (px):", JSON.stringify(gap_report, null, 2));

  if (all_issues.length > 0) {
    console.warn("Layout checks reported issues:");
    for (const i of all_issues) console.warn(`  - ${i}`);
    process.exitCode = 2;
  }

  console.log(`Screenshots saved under ${out_dir}`);
}

main().catch((err) => {
  console.error(err);
  if (dev) dev.kill("SIGTERM");
  process.exit(1);
});