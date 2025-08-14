# Plan: Investigate blank rendering in custom Gantt visual

## Objective
Diagnose and fix why the visual renders nothing despite successful packaging.

## Context & History
- Project targets Power BI Visuals API 5.2.0 (`pbiviz.json`, `package.json`).
- Local toolchain: `powerbi-visuals-tools` 5.2.0 via `npx`; global 6.1.3 exists but not used for builds.
- Node is currently v24.5.0; packaging succeeded under Node 24.
- Prior guidance recommended Node 18 for pbiviz 5.2.0; keep in mind if dev server shows issues.

## Steps already taken
- Inspected `package.json`, `tsconfig.json`, `pbiviz.json`, `capabilities.json`, `webpack.config.ts`.
- Verified versions (Node/npm/pbiviz local/global).
- Ran `npx pbiviz package` → success; `.pbiviz` generated in `dist/`.
- Imported into Power BI; bound fields; visual shows blank.

## Investigation plan (ordered)
1. Dev-run and inspect data flow
   - Run: `npx pbiviz start` (repo root `gantt-chart-powerbi/`).
   - In `src/visual.ts`:
     - Log when `update()` is invoked and `options.dataViews[0]` presence.
     - Log `dataView.table`, column roles, and `rows.length`.
     - Log computed `idx` for each role and count of parsed tasks/milestones.
   - In `src/components/GanttVisual.ts`:
     - Add a minimal placeholder draw (e.g., append text) to verify the render path executes.

2. Validate capability-role alignment
   - Confirm role names in `capabilities.json` match `Visual.converter()` references: `id`, `name`, `phase`, `startDate`, `endDate`, `milestone`, `dependencies`, `progress`.
   - Ensure `progress` is a measure and others are grouping as intended.

3. Data parsing hardening
   - Implement safe date parsing that handles JS Date, number (OADate/epoch), and string.
   - Guard against missing indices; skip rows with invalid dates; log counts of skipped rows.
   - Ensure `milestone` coercion handles boolean, 0/1, and string values reliably.

4. Rendering safeguards
   - If no tasks/milestones parsed, render a diagnostic message in the SVG (e.g., "No data parsed").
   - Ensure the container/SVG sizing is correct and not zero height/width.

5. Type/lint/tests
   - Run: `npm run lint` and fix issues.
   - Add a lightweight unit test for the converter with sample rows (if feasible via `ts-jest`).

6. Repackage and validate
   - `npx pbiviz package` → import into Power BI and validate with the same dataset.

## Contingency
- If dev server tooling fails under Node 24, switch to Node 18.20.3 using nvm-windows and retry.

## Deliverables
- Fixed visual that renders tasks/milestones.
- Diagnostics/logging removed or gated behind a debug flag.
- Updated docs (`docs/issues.md` status updated; this plan refined with outcomes).

## Notes
- Always use `npx pbiviz` to ensure the local 5.2.0 tools version is used.
- Keep `capabilities.json` and the converter role names in strict sync.
