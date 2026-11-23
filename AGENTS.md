# ZYFN

## Collaboration

- Reply to the user in a natural English and Chinese mix.
- Requirements planning continues. The user has authorized desktop Dashboard, bank transaction, TNG transaction, and bank-specific fixed deposit UI prototypes using sample data. Authentication and database integration await implementation scope confirmation.
- Record unresolved requirements explicitly. Confirm material scope decisions with the user.

## Product

ZYFN is a new personal finance system informed by the existing Coinflow project at `/Users/chin/Documents/GitHub/coinflow`.

Confirmed requirements

- Support access across multiple devices using shared database records.
- Import PDF and Excel exports from TNG and different banks each month.
- Retain and track all historical financial data.
- Revisit financial calculations and behavior because the existing system may contain issues.
- Support creating, reading, and updating records. Record deletion is prohibited.
- Transaction types and categories remain to be defined.

## Architecture decisions

- Host the application and backend on Cloudflare Workers using the user's domain. Target the free plan and validate resource limits during design.
- Use Supabase exclusively for its PostgreSQL database.
- Supabase Auth, Storage, Realtime, Edge Functions, and other non-database services are prohibited.
- Use Google OAuth 2.0 with OpenID Connect for login. Implement authentication and session handling outside Supabase.
- Keep database credentials on the backend.
- The frontend framework and database connection method remain to be selected.

## Existing functionality to review

Use Coinflow as a reference when defining requirements for monthly summaries, statement filtering, bank account views, TNG wallet and GO+ tracking, fixed deposits, transfer exploration, charts, and Excel export.

Review the existing behavior with the user before carrying calculations or categorization rules into ZYFN.

## Proposed design awaiting agreement

- Represent institutions, accounts, import batches, source records, transactions, transfers, and fixed deposits explicitly.
- Preserve original source values and traceability to the imported row or PDF page.
- Normalize different export layouts through source-specific parsers.
- Provide import preview, validation, correction, and duplicate review before confirmation.
- Store monetary values in integer minor units with an explicit currency.
- Track own-account transfers separately from income and expenses.
- Keep an edit history and handle concurrent updates from multiple devices.

These proposals are planning inputs and require refinement before implementation.

## Open requirements

- Single authorized Google account or multiple independently registered users.
- Whether voiding incorrect records is permitted under the no-delete requirement, and how voided records affect reports.
- Exact banks, export layouts, password-protected PDFs, and whether PDFs contain selectable text or scans.
- Whether original PDF and Excel files must be retained permanently, and which private file storage to use. Cloudflare R2 is a candidate.
- Whether external OCR or AI processing is allowed, and the available budget.
- Transaction classification rules, reporting definitions, supported currencies, and FD lifecycle behavior.
- Historical migration scope and reconciliation criteria.
- Mobile workflows and additional institution support.

## Working practices

- Keep changes focused on the user's requested scope.
- Inspect the actual repository and installed dependency documentation before making framework-specific changes.
- When Next.js is selected and its bundled documentation is available, consult the relevant guides under `node_modules/next/dist/docs/`.
- Preserve the user's financial source files and avoid exposing their contents or secrets in logs and public assets.
- Verify changes using appropriate project checks once implementation and tooling exist. Report incomplete checks accurately.
- Update this guide as the user resolves requirements or changes architecture decisions.

## Approved UI scope

- Build the desktop Dashboard first, with English interface text.
- Prioritize monthly spending, fixed deposit status, and account balances.
- Follow the user's updated preference for a formal financial workspace. Use navy and neutral grays, white panels, small corner radii, clear borders, compact spacing, and restrained typography. Brand the product ZYFN.
- Tables require an outer border and a complete grid of horizontal and vertical cell borders.
- Use sample data for the layout preview. Authentication work is deferred based on the current interpretation of the user's scope.
- The sidebar has a Dashboard, a Transactions group with Maybank and Public Bank transactions, a separate TNG transaction page, and a Fixed deposits group with bank-specific FD pages.
- Each FD page shows that bank's deposit register and FD activity, including placements, redemptions, and interest. The user has accepted the formal UI style.
- The standalone `index.html` prototype does not select the production frontend framework.

- Sidebar groups use collapsible menus with borderless active tabs. Keep the header compact and the sidebar footer anchored at the viewport bottom. Use one shared content footer across pages.

- All tables use the reusable `components/data-table.js` component, with sortable headers, global column search, and pagination sizes 25, 50, 100, 200, and All.
- Sidebar groups animate open and closed, including interrupted transitions, and respect reduced-motion preferences.

- The reusable table owns an Export action with weekly (Monday–Sunday), monthly, yearly, and inclusive custom date ranges. The prototype exports CSV from all matching loaded rows across pages, retaining current search and sort.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
