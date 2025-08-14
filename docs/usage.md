# Gantt Chart Power BI Visual — Usage Guide

This guide explains how to build, package, and use the custom Gantt chart visual in Power BI, and how to configure phases, tasks, milestones, and dependencies.

## Prerequisites
- Node.js LTS (>= 18 recommended)
- Power BI Desktop (latest)
- Power BI Visuals Tools (installed via devDependencies)

## Install Dependencies
From the project root `gantt-chart-powerbi/` run:

```bash
npm install
```

## Run in Developer Mode
Start the visual in dev mode and load in Power BI Desktop:

```bash
npm run start
```

This runs `pbiviz start` and opens a local server. In Power BI Desktop:
- File > Options and settings > Options > Security: enable “Trusted third party visuals” (if needed).
- Insert > Get more visuals > “Import a visual from a file” > Use the localhost developer visual option.

## Package the Visual (.pbiviz)
Create a distributable package:

```bash
npm run package
```

The output `.pbiviz` file will be in the `dist/` folder.

## Data Mapping
- Category: task name
- Start: start date
- End: end date
- Phase: text field; values should match the configured phase keys
- Milestone: boolean or text (truthy) indicates milestone
- Dependency: task identifier(s); can be comma-separated
- Progress: number 0-100

## Formatting Pane
- Timeline: show grid, time unit
- Phases: set color and label per phase
- Tasks: bar height, spacing
- Milestones: color, size
- Dependencies: line color, width

## Editing Phases
Phases are configurable in the formatting pane. Update phase names and colors to match your data values. The visual uses a mapping object of `phaseKey -> { label, color }` so you can rename phases without changing your data.

## Known Limitations
- Ensure all date fields are valid dates.
- Dependency resolution expects IDs present among task IDs.

## Contributing / Development
- Lint: `npm run lint`
- Tests: `npm test`
- Web dev server (optional): `npm run serve`

See `docs/architecture.md` for a detailed overview of code structure and components.
