# Issue: Visual renders blank after packaging

- __Status__: Open
- __First observed__: 2025-08-13
- __Environment__:
  - Node: v24.5.0
  - npm: 11.5.1
  - powerbi-visuals-tools (local via npx): 5.2.0
  - powerbi-visuals-tools (global): 6.1.3
  - powerbi-visuals-api: 5.2.0
  - apiVersion (pbiviz.json): 5.2.0
- __Repo path__: repository root
- __Artifact__: `dist/ganttChartPowerBIVisual.1.0.0.0.pbiviz`

## Summary
Packaging succeeds under Node 24 using local pbiviz 5.2.0, but when the visual is placed on a report and fields are bound (id, name, phase, startDate, endDate, milestone, dependencies, progress), the canvas remains blank. Screenshot indicates fields are assigned, but no marks are drawn.

## Reproduction Steps
1. Build/package: `npx pbiviz package` (success; artifact produced in `dist/`).
2. Import `.pbiviz` into Power BI Desktop.
3. Add the visual to a report.
4. Bind fields as per `capabilities.json` roles.
5. Observe: blank visual (no bars/milestones), though no explicit error is shown.

## Expected vs Actual
- __Expected__: Gantt bars and milestones render according to bound fields.
- __Actual__: Empty canvas; appears as if no data rendered.

## Data bindings used
- Task ID → `id`
- Task Name → `name`
- Phase → `phase`
- Start Date → `startDate`
- End Date → `endDate`
- Milestone → `milestone`
- Dependencies → `dependencies`
- Progress (measure) → `progress`

## Observations
- No packaging errors.
- `capabilities.json` uses a table mapping; `visual.ts` reads `dataView.table` and indexes roles by name.
- Potential mismatch or empty result from `Visual.converter()` could yield empty arrays, leading to no drawing.

## Suspected Causes
- __DataView shape mismatch__: `dataView.table` may be undefined or columns not role-mapped as expected.
- __Role name mismatch__: Role keys in `capabilities.json` vs `visual.ts` indices.
- __Date parsing__: `new Date(value)` may be invalid if values are numbers/strings requiring conversion.
- __Render no-op__: `GanttVisual.render()` might bail early on empty data or throw silently.
- __Milestone flag__: Non-boolean truthiness leading to all rows treated as tasks or filtered out.

## Immediate Next Actions
- Run `npx pbiviz start` and test in Developer Mode; add console logs in `Visual.update()` and `Visual.converter()` to inspect `dataView` shape and row counts.
- Add a placeholder draw (e.g., text/rect) in `GanttVisual.render()` to confirm render path executes.
- Validate role names and indices mapping.
- Harden date parsing and null checks.

## Links/Artifacts
- `pbiviz.json` (apiVersion 5.2.0)
- `capabilities.json` (table mapping, roles)
- `src/visual.ts` (`Visual.converter`, `update`)
- `src/components/GanttVisual.ts` (render path)

---
Updated by: Cascade

## Issue: Only headers show, body blank in Desktop/Service (no data/formatting visible)

- __Status__: Open
- __First observed__: 2025-08-13
- __Environment__: Desktop and Service

### Symptoms
- Visual title shows (e.g., “Sum of progress by id, name…”), roles are bound, but canvas content is empty. No task bars, milestones, labels, or grid appear.

### Root-cause analysis (suspected)
- __Zero-size viewport used for layout__: `GanttVisual` computed layout from `container.clientWidth/Height`, which can be 0 in Power BI host, producing zero ranges for scales and nothing renders. See `src/components/GanttVisual.ts` prior code.
- __Degenerate time domain__: When min/max dates are identical (single-day tasks/milestones), the time scale domain collapses, resulting in zero-width bars. Previously unguarded.
- __Lack of diagnostics__: No on-canvas message when parsed data is empty or viewport is 0, making blankness hard to diagnose.

### Changes implemented
- `src/components/GanttVisual.ts`
  - Added `setViewport(width,height)` and track `viewportWidth/Height`.
  - Use viewport for SVG size and scale ranges; added guards for invalid/zero domain and safe padding in band scale.
  - Added `renderDiagnostic()` overlay for “No parsed tasks” or “Zero-size viewport”.
- `src/visual.ts`
  - In `update()`, pass `options.viewport` to `gantt.setViewport()`.
  - Wrapped `gantt.render()` in try/catch and minor console diagnostics.

### Next steps to verify
1. Build/package: `npm run package` and import the new `.pbiviz` from `dist/` into Desktop/Service.
2. Bind roles and confirm content renders. If still blank, look for on-canvas diagnostic text (“[Gantt] …”).
3. If message is “No parsed tasks to render”, inspect column role mapping and parsed rows (run Developer Mode and check console). If message is “Zero-size viewport…”, re-check host viewport propagation.

### Acceptance criteria
- Visual renders non-empty bars/milestones with the sample CSV in both Desktop and Service.
- When no data or zero-size occurs, a diagnostic label appears instead of a silent blank.

Updated by: Cascade
