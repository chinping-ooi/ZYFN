/**
 * Playwright checks: vertical scroll and unclipped cards on key routes.
 * Usage: SMOKE_SKIP_DEV_START=1 node scripts/verify_responsive_scroll.mjs
 * (with `npm run dev` or `npm run start` on port 3000)
 */
import { chromium } from "playwright";
import { execSync, spawn } from "child_process";
import { setTimeout as delay } from "timers/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

const ROUTES = [
  { name: "Dashboard", path: "/" },
  { name: "PBE summary", path: "/transactions/pbe" },
  { name: "PBE statement", path: "/transactions/pbe/statement" },
  { name: "MBB 2 Gold summary", path: "/credit-cards/mbb-2-gold" },
  { name: "MBB 2 Gold statement", path: "/credit-cards/mbb-2-gold/statement" },
  { name: "MBB 2 Gold card", path: "/credit-cards/mbb-2-gold/1697" },
  { name: "Wallet", path: "/transactions/touch-n-go" },
  { name: "Wallet statement", path: "/transactions/touch-n-go/statement" },
  { name: "Fixed deposits", path: "/fixed-deposits" },
  { name: "Import", path: "/import" },
];

const VIEWPORTS = [
  { label: "375x812", width: 375, height: 812, expectScroll: true },
  { label: "768x1024", width: 768, height: 1024, expectScroll: true },
  { label: "1280x800", width: 1280, height: 800, expectScroll: false },
];

let dev = null;

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(base);
      if (res.ok || res.status < 500) return;
    } catch {
      /* retry */
    }
    await delay(500);
  }
  throw new Error("Server did not become ready");
}

async function startServer() {
  const ownDev = process.env.SMOKE_SKIP_DEV_START !== "1";
  if (!ownDev) {
    await waitForServer();
    return;
  }
  try {
    execSync(`fuser -k ${new URL(base).port || 3000}/tcp 2>/dev/null || true`, {
      stdio: "ignore",
    });
  } catch {
    /* */
  }
  await delay(400);
  dev = spawn("npm", ["run", "start", "--", "-p", "3000"], {
    cwd: root,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForServer();
}

async function verifyPage(page, route, vp) {
  const issues = [];
  await page.goto(base + route.path, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(500);

  const doc = await page.evaluate(() => {
    const el = document.documentElement;
    return {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    };
  });

  const footerVisibleAfterScroll = await page.evaluate(async () => {
    const footer = document.querySelector("footer");
    if (!footer) return { ok: false, reason: "no footer" };
    const before = footer.getBoundingClientRect().top;
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 100));
    const after = footer.getBoundingClientRect().top;
    const inView = after < window.innerHeight && after >= 0;
    return { ok: inView, before, after };
  });

  const clipped = await page.evaluate(() => {
    const out = [];
    const cards = document.querySelectorAll("main .card, main section.card");
    cards.forEach((card, i) => {
      const style = getComputedStyle(card);
      const scrollH = card.scrollHeight;
      const clientH = card.clientHeight;
      const overflow = style.overflowY;
      if (overflow === "hidden" && scrollH > clientH + 2) {
        out.push({
          overflow,
          scrollH,
          clientH,
          selector: `card[${i}] ${card.querySelector("h2,h3")?.textContent?.slice(0, 40) ?? ""}`,
        });
      }
    });
    return out;
  });

  const hasSpendingBreakdown = await page
    .locator("text=Spending breakdown")
    .first()
    .isVisible()
    .catch(() => false);
  const supabaseMissing = await page
    .locator("text=Supabase not configured")
    .first()
    .isVisible()
    .catch(() => false);

  const layout = await page.evaluate(() => {
    const main = document.querySelector("main");
    const shell = document.querySelector(".shell");
    if (!main || !shell) return { ok: false, reason: "missing main/shell" };
    return {
      mainOverflowY: getComputedStyle(main).overflowY,
      shellHeight: getComputedStyle(shell).height,
    };
  });

  if (vp.expectScroll && layout.mainOverflowY === "hidden") {
    issues.push(`main overflow-y is hidden below lg (${layout.mainOverflowY})`);
  }

  const canScroll = doc.scrollHeight > doc.clientHeight + 8;
  if (vp.expectScroll) {
    const needsTallPage =
      hasSpendingBreakdown ||
      route.path === "/fixed-deposits" ||
      route.path.includes("/statement");
    const clearlyTallerThanViewport = doc.scrollHeight > vp.height + 80;
    if (needsTallPage && !supabaseMissing && !canScroll && clearlyTallerThanViewport) {
      issues.push(
        `scrollHeight (${doc.scrollHeight}) ≈ clientHeight (${doc.clientHeight})`,
      );
    }
    if (
      route.path === "/" &&
      hasSpendingBreakdown &&
      !supabaseMissing &&
      !canScroll
    ) {
      issues.push(`expected document scroll on populated dashboard`);
    }
    if (!footerVisibleAfterScroll.ok) {
      issues.push(
        `footer not reachable after scroll: ${JSON.stringify(footerVisibleAfterScroll)}`,
      );
    }
    if (clipped.length > 0) {
      issues.push(`clipped cards: ${JSON.stringify(clipped)}`);
    }
  } else if (route.path === "/") {
    const main = await page.evaluate(() => {
      const m = document.querySelector("main.dashboard-main");
      if (!m) return null;
      const s = getComputedStyle(m);
      return { overflowY: s.overflowY, clientHeight: m.clientHeight };
    });
    if (main && main.overflowY !== "hidden") {
      issues.push(`desktop dashboard main should lock overflow (got ${main.overflowY})`);
    }
  }

  return {
    route: route.name,
    viewport: vp.label,
    scrollHeight: doc.scrollHeight,
    clientHeight: doc.clientHeight,
    canScroll,
    ok: issues.length === 0,
    issues,
  };
}

async function main() {
  await startServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      try {
        const row = await verifyPage(page, route, vp);
        results.push(row);
        const status = row.ok ? "PASS" : "FAIL";
        console.log(
          `${status}\t${vp.label}\t${route.name}\tscroll=${row.scrollHeight}/${row.clientHeight}${
            row.issues.length ? `\t${row.issues.join("; ")}` : ""
          }`,
        );
      } catch (err) {
        results.push({
          route: route.name,
          viewport: vp.label,
          ok: false,
          issues: [String(err)],
        });
        console.log(`FAIL\t${vp.label}\t${route.name}\t${err}`);
      }
      await context.close();
    }
  }

  await browser.close();
  if (dev) dev.kill("SIGTERM");

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\n${failed.length} verification failure(s)`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} checks passed`);
}

main().catch((err) => {
  console.error(err);
  if (dev) dev.kill("SIGTERM");
  process.exit(1);
});