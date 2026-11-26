/**
 * Playwright layout checks with synthetic dashboard at /mock-dashboard.
 */
import { chromium } from "playwright";
import { execSync, spawn } from "child_process";
import { setTimeout as delay } from "timers/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

const ROUTES = [
  { name: "Dashboard (mock)", path: "/mock-dashboard", needs_cards: true },
  { name: "PBE summary", path: "/transactions/pbe" },
  { name: "PBE statement", path: "/transactions/pbe/statement" },
  { name: "MBB 2 Gold summary", path: "/credit-cards/mbb-2-gold" },
  { name: "MBB 2 Gold statement", path: "/credit-cards/mbb-2-gold/statement" },
  { name: "Wallet", path: "/transactions/touch-n-go" },
  { name: "Wallet statement", path: "/transactions/touch-n-go/statement" },
  { name: "Fixed deposits", path: "/fixed-deposits" },
  { name: "Import", path: "/import" },
];

const VIEWPORTS = [
  { label: "375x812", width: 375, height: 812, expect_doc_scroll: true },
  { label: "768x1024", width: 768, height: 1024, expect_doc_scroll: true },
  { label: "1280x800", width: 1280, height: 800, expect_doc_scroll: false },
];

let server = null;

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(base + "/mock-dashboard");
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await delay(500);
  }
  throw new Error("Server did not become ready");
}

async function startServer() {
  if (process.env.SMOKE_SKIP_DEV_START === "1") {
    await waitForServer();
    return;
  }
  const port = new URL(base).port || "3000";
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: "ignore" });
  } catch {
    /* */
  }
  try {
    const pid = execSync(`lsof -ti :${port} 2>/dev/null || true`, {
      encoding: "utf8",
    }).trim();
    if (pid) {
      execSync(`kill -9 ${pid.split("\n").join(" ")} 2>/dev/null || true`, {
        stdio: "ignore",
      });
    }
  } catch {
    /* */
  }
  await delay(400);
  execSync("npm run build", { cwd: root, stdio: "inherit" });
  server = spawn("npm", ["run", "start", "--", "-p", "3000"], {
    cwd: root,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForServer();
}

async function verifyPage(page, route, vp) {
  const issues = [];
  await page.goto(base + route.path, {
    waitUntil: "networkidle",
    timeout: 90_000,
  });
  if (route.needs_cards) {
    await page
      .getByRole("heading", { name: "Spending breakdown", exact: true })
      .waitFor({ state: "visible", timeout: 30_000 });
  } else {
    await page.waitForTimeout(400);
  }

  const doc = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
  }));

  const mainBox = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return null;
    const r = main.getBoundingClientRect();
    const s = getComputedStyle(main);
    return {
      height: r.height,
      overflowY: s.overflowY,
      visible: r.height > 0 && s.visibility !== "hidden" && s.display !== "none",
    };
  });

  if (!mainBox?.visible || mainBox.height < 50) {
    issues.push(`main missing or too short (${mainBox?.height ?? 0}px)`);
  }

  const key_cards = await page.evaluate(() => {
    const titles = [
      "Spending breakdown",
      "Monthly cash flow",
      "Account balances",
      "Monthly spending",
    ];
    return titles.map((title) => {
      let card = null;
      const heading = [...document.querySelectorAll("h3,h2")].find(
        (el) => el.textContent?.trim() === title,
      );
      if (heading) {
        card = heading.closest(".card, section.card");
      } else {
        const kpi = [...document.querySelectorAll("article.card.kpi")].find(
          (el) =>
            el.querySelector(".text-sm.font-semibold")?.textContent?.trim() ===
            title,
        );
        card = kpi ?? null;
      }
      if (!card) return { title, ok: false, reason: "not found" };
      const r = card.getBoundingClientRect();
      const s = getComputedStyle(card);
      const clipped =
        s.overflowY === "hidden" && card.scrollHeight > card.clientHeight + 2;
      return {
        title,
        ok: r.height > 100 && s.visibility !== "hidden" && !clipped,
        height: r.height,
        scrollH: card.scrollHeight,
        clientH: card.clientHeight,
        clipped,
      };
    });
  });

  if (route.needs_cards) {
    for (const c of key_cards) {
      if (!c.ok) {
        issues.push(`card "${c.title}": ${JSON.stringify(c)}`);
      }
    }
  }

  const footerOk = await page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 150));
    const footer = document.querySelector("footer");
    if (!footer) return false;
    const r = footer.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });

  const canScroll = doc.scrollHeight > doc.clientHeight + 8;

  if (vp.expect_doc_scroll) {
    if (route.path === "/mock-dashboard" && !canScroll) {
      issues.push(
        `mock dashboard should scroll (${doc.scrollHeight}/${doc.clientHeight})`,
      );
    }
    if (!footerOk) issues.push("footer not reachable after scroll");
    if (mainBox?.overflowY === "hidden") {
      issues.push(`main overflow-y hidden at ${vp.label}`);
    }
  } else if (route.path === "/mock-dashboard") {
    const dashCards = key_cards.filter((c) =>
      ["Spending breakdown", "Monthly cash flow", "Account balances"].includes(
        c.title,
      ),
    );
    if (dashCards.some((c) => !c.ok)) {
      issues.push(`desktop dashboard cards: ${JSON.stringify(dashCards)}`);
    }
    const mainLock = await page.evaluate(() => {
      const m = document.querySelector("main.dashboard-main");
      return m ? getComputedStyle(m).overflowY : null;
    });
    if (mainLock !== "hidden") {
      issues.push(`desktop dashboard main overflow should be hidden (got ${mainLock})`);
    }
    const shellH = await page.evaluate(() =>
      document.querySelector(".shell")?.getBoundingClientRect().height,
    );
    if (shellH && Math.abs(shellH - vp.height) > 4) {
      issues.push(`desktop shell height ${shellH} expected ~${vp.height}`);
    }
  }

  return {
    route: route.name,
    viewport: vp.label,
    scroll: `${doc.scrollHeight}/${doc.clientHeight}`,
    main_h: mainBox?.height,
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
        console.log(
          `${row.ok ? "PASS" : "FAIL"}\t${vp.label}\t${route.name}\tscroll=${row.scroll}\tmain=${Math.round(row.main_h ?? 0)}${row.issues.length ? `\t${row.issues.join("; ")}` : ""}`,
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
  if (server) server.kill("SIGTERM");

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\n${failed.length} failure(s)`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} checks passed`);
}

main().catch((err) => {
  console.error(err);
  if (server) server.kill("SIGTERM");
  process.exit(1);
});