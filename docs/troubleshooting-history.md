# Gantt Visual Troubleshooting History

## Problem Statement
Custom Power BI Gantt visual renders blank despite:
- Data being successfully bound and visible in table view
- Visual packaging completing without errors
- Fields being correctly mapped to visual roles

## Environment
- Node.js: v24.5.0 (works despite v18 recommendation)
- powerbi-visuals-tools: 5.2.0 (local via npx)
- Power BI Visuals API: 5.2.0
- Testing: Power BI Desktop & Service

## Failed Attempts & Lessons Learned

### 1. Viewport Sizing Issue (Partially Resolved)
**Problem**: Visual used `container.clientWidth/Height` which can be 0 in Power BI host
**Attempted Fix**: Added `setViewport()` method and used `options.viewport` dimensions
**Result**: Still blank - this was only part of the issue

### 2. Debug Overlays Not Appearing
**Problem**: Added diagnostic text overlays but they never appeared in the visual
**Attempted Fix**: Multiple debug messages at different render stages
**Result**: No debug text visible - indicates code isn't reaching render path

### 3. Data Converter Mismatch
**Problem**: Initial code expected categorical data, but capabilities.json defines table mapping
**Attempted Fix**: Rewrote converter to use `dataView.table` instead of `dataView.categorical`
**Result**: Converter fixed but visual still blank

## Root Cause Analysis

### Critical Discovery: Code Duplication
The codebase has **TWO different GanttVisual implementations**:

1. **Old Implementation** (being packaged):
   - Located in compiled form, expects categorical data
   - Has methods: `updateData()`, `updateSettings()`
   - Uses simplified rendering without proper components

2. **New Implementation** (what we've been editing):
   - Located in `src/components/GanttVisual.ts`
   - Has methods: `render()`, `setViewport()`
   - Uses modular renderers (TaskRenderer, MilestoneRenderer, etc.)

### The Packaging Problem
The build process is compiling an outdated version that:
- Doesn't match our current source structure
- Lacks the table-based data converter
- Missing all debug overlays and viewport fixes

## Why Previous Fixes Failed

1. **Wrong Target**: We've been editing the new modular implementation while the packaged code uses the old monolithic version
2. **Build Cache**: The packaging process may be using cached/stale compiled output
3. **Import Mismatch**: The main `visual.ts` file may be importing the wrong GanttVisual class

## Next Steps to Resolve

1. **Verify Imports**: Check that `src/visual.ts` imports the correct GanttVisual
2. **Clean Build**: Remove all build artifacts and caches
3. **Align Implementations**: Either:
   - Fix imports to use the new modular implementation, OR
   - Port fixes to the old implementation being packaged
4. **Add Build Verification**: Include a unique marker in the code to verify correct packaging

## Debugging Commands Used

```powershell
# Clean and rebuild
Remove-Item -Recurse -Force dist, .tmp
npx pbiviz package

# Verify packaged content
$pb = Get-ChildItem dist -Filter *.pbiviz
Expand-Archive $pb.FullName -DestinationPath dist/unzipped
Select-String -Path "dist/unzipped/resources/visual.js" -Pattern "setViewport","render"
```

## Key Learnings

1. **Always verify the packaged artifact** matches source code
2. **Check for duplicate implementations** when inheriting codebases
3. **Add distinctive markers** in code to verify correct build pipeline
4. **Power BI visuals can fail silently** - always add debug overlays
5. **Build tools may cache aggressively** - clean builds are essential

## Data Format Requirements

The visual expects table data with these columns:
- `id`: Task identifier
- `name`: Task name
- `phase`: Phase grouping
- `startDate`: Task start (supports dd.mm.yyyy format)
- `endDate`: Task end
- `milestone`: Boolean flag
- `dependencies`: Comma/semicolon separated IDs
- `progress`: Percentage (0-100)

## Common Pitfalls

1. **Viewport Size**: Power BI may provide 0x0 viewport initially
2. **Date Parsing**: Excel serial dates need special handling
3. **Role Mapping**: Column roles must match capabilities.json exactly
4. **Silent Failures**: Errors in render don't show - need try/catch blocks
5. **Build Artifacts**: Old compiled code can persist across builds

## Repository reset and nested .git fix (2025-08-14)

- **Problem**: Local folder referenced a deleted GitHub repo and contained a nested Git repository at `PBI_CVs/.git`, which caused Git to treat it like a submodule without a checked-out commit.
- **Symptoms**:
  - `git add` errors: “does not have a commit checked out” for the `PBI_CVs/` folder
  - Push failures to the old remote `eek2020/PBI_CVs` (repo missing)
- **Actions Taken**:
  1. Removed nested Git metadata: deleted `PBI_CVs/.git`.
  2. Added `PBI_CVs/` to `.gitignore` to prevent future submodule-like issues.
  3. Reinitialized repository at the root `/Users/erichook-marshall/Git/PBI_CVs` and set branch to `main`.
  4. Staged and committed all files (excluding ignored paths).
  5. Updated remote to the new repository `https://github.com/eek2020/PBIViz.git`.
  6. Pushed initial commit to `main`.
- **Verification**:
  - `git remote -v` shows `origin  https://github.com/eek2020/PBIViz.git`
  - `git status` clean after commit
  - GitHub repo displays the initial commit on `main`
- **Notes**:
  - Prefer HTTPS remotes.
  - Avoid nested repositories unless intentionally using submodules; if accidental, remove inner `.git` and add the folder to `.gitignore`.

### Reference commands (for future similar situations)

```bash
# Remove nested repo metadata and ignore the folder
rm -rf PBI_CVs/.git
printf "\nPBI_CVs/\n" >> .gitignore

# Reinitialize and connect to the correct remote
git init -b main
git add .
git commit -m "Initial commit after repo reset; ignore nested PBI_CVs/"
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/eek2020/PBIViz.git
git push -u origin main
