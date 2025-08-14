import { VisualSettings } from './settings';
import powerbi from 'powerbi-visuals-api';
import { GanttVisual } from './components/GanttVisual';
import { PhaseConfig } from './components/PhaseConfig';
import { IGanttTask } from './models/GanttData';

export class Visual {
    private settings: VisualSettings = new VisualSettings();
    private phaseConfig: PhaseConfig;
    private gantt: GanttVisual;
    private container: HTMLElement;

    constructor(options?: powerbi.extensibility.visual.VisualConstructorOptions) {
        // Initialize visual elements
        if (!options) {
            throw new Error('VisualConstructorOptions is required');
        }
        this.container = options.element;
        
        // Add immediate visual feedback
        this.container.style.backgroundColor = '#f0f0f0';
        const initDiv = document.createElement('div');
        initDiv.textContent = 'Gantt Visual Loading...';
        initDiv.style.padding = '10px';
        initDiv.style.color = '#666';
        initDiv.id = 'gantt-init-message';
        this.container.appendChild(initDiv);
        
        this.settings = new VisualSettings();
        this.phaseConfig = new PhaseConfig(this.settings);
        this.gantt = new GanttVisual(this.container, this.settings, this.phaseConfig);
    }

    public update(options: powerbi.extensibility.visual.VisualUpdateOptions) {
        // BUILD MARKER: v2.0-modular-2024
        console.log('[Gantt] BUILD MARKER: v2.0-modular-2024');
        
        // Update visual with data
        const data = options.dataViews[0];
        // Ensure Gantt knows the current viewport (Desktop/Service)
        if (options && options.viewport) {
            this.gantt.setViewport(options.viewport.width, options.viewport.height);
        }
        this.settings = Visual.parseSettings(data);

        // Update phase config with new settings
        this.phaseConfig = new PhaseConfig(this.settings);
        
        // Process and update data
        const processedData = Visual.converter(data);
        console.log('[Gantt] Converted data:', { 
            tasks: processedData.tasks.length, 
            milestones: processedData.milestones.length,
            viewport: options.viewport 
        });
        
        try {
            this.gantt.render(processedData);
        } catch (e) {
            // Swallow to prevent host from suppressing visual; log for diagnostics
            // eslint-disable-next-line no-console
            console.error('[Gantt] render error', e);
        }
    }

    private static parseSettings(dataView: any): VisualSettings {
        const settings = new VisualSettings();
        // TODO: map Power BI formatting pane objects to VisualSettings when defined
        return settings;
    }

    // Helper: robust date parsing for Date | number | string (supports dd.mm.yyyy and Excel serials)
    private static parseDate(value: any): Date | null {
        if (value == null) return null;
        // Already a Date
        if (value instanceof Date) {
            return isNaN(value.getTime()) ? null : value;
        }
        // Numeric: epoch ms or Excel serial days since 1899-12-30
        if (typeof value === 'number' && isFinite(value)) {
            // Heuristic: large numbers -> epoch ms, else treat as Excel serial days
            const num = value;
            if (num > 1e11) {
                const d = new Date(num);
                return isNaN(d.getTime()) ? null : d;
            }
            // Excel serial (including values <= 60 around 1900 leap bug)
            const excelEpoch = Date.UTC(1899, 11, 30); // 1899-12-30
            const ms = excelEpoch + Math.round(num * 86400000);
            const d = new Date(ms);
            return isNaN(d.getTime()) ? null : d;
        }
        // String parsing
        if (typeof value === 'string') {
            const s = value.trim();
            if (!s) return null;
            // dd.mm.yyyy or dd/mm/yyyy or dd-mm-yyyy
            const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
            if (m) {
                const day = parseInt(m[1], 10);
                const month = parseInt(m[2], 10) - 1;
                let year = parseInt(m[3], 10);
                if (year < 100) year += 2000; // basic 2-digit year support
                const d = new Date(year, month, day);
                return isNaN(d.getTime()) ? null : d;
            }
            // ISO-like or locale-parseable fallback
            const d = new Date(s);
            return isNaN(d.getTime()) ? null : d;
        }
        return null;
    }

    // Helper: coerce diverse truthy/falsey milestone representations
    private static coerceBool(value: any): boolean {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') {
            const v = value.trim().toLowerCase();
            if (['true', '1', 'yes', 'y', 't'].includes(v)) return true;
            if (['false', '0', 'no', 'n', 'f'].includes(v)) return false;
        }
        return Boolean(value);
    }

    // Helper: find column index by role with fallbacks to queryName/displayName
    private static findColumnIndex(table: powerbi.DataViewTable, role: string): number {
        const cols = table.columns || [];
        const roleLc = role.toLowerCase();
        // 1) Exact role match
        let idx = cols.findIndex(c => !!c.roles && (c.roles as any)[role] === true);
        if (idx >= 0) return idx;
        // 2) Fallback: queryName ends-with or equals role (case-insensitive)
        idx = cols.findIndex(c => {
            const q = (c as any).queryName as string | undefined;
            if (!q) return false;
            const last = q.split('.').pop() || q;
            return last.toLowerCase() === roleLc || q.toLowerCase().endsWith('.' + roleLc);
        });
        if (idx >= 0) return idx;
        // 3) Fallback: displayName equals role (case-insensitive)
        idx = cols.findIndex(c => {
            const d = (c as any).displayName as string | undefined;
            return d ? d.trim().toLowerCase() === roleLc : false;
        });
        return idx; // may be -1
    }

    public static converter(dataView: powerbi.DataView | undefined): IGanttTask {
        if (!dataView || !dataView.table) {
            return { tasks: [], milestones: [], dependencies: [] };
        }
        const table = dataView.table as powerbi.DataViewTable;
        const colIndex = (role: string) => Visual.findColumnIndex(table, role);

        const idx = {
            id: colIndex('id'),
            name: colIndex('name'),
            phase: colIndex('phase'),
            start: colIndex('startDate'),
            end: colIndex('endDate'),
            milestone: colIndex('milestone'),
            deps: colIndex('dependencies'),
            progress: colIndex('progress')
        };

        const rows = table.rows || [];
        if (!rows.length) {
            return { tasks: [], milestones: [], dependencies: [] };
        }

        const tasks: any[] = [];
        const milestones: any[] = [];
        
        for (const r of rows) {
            const rawDeps = idx.deps >= 0 ? r[idx.deps] : undefined;
            const depStr = rawDeps == null ? '' : String(rawDeps);
            const dependencies = depStr
                ? depStr.split(/[;,]/).map(d => d.trim()).filter(d => d)
                : [];

            const isMs = idx.milestone >= 0 ? Visual.coerceBool(r[idx.milestone]) : false;

            const startVal = idx.start >= 0 ? r[idx.start] : undefined;
            const endVal = idx.end >= 0 ? r[idx.end] : undefined;
            let start = Visual.parseDate(startVal);
            let end = Visual.parseDate(endVal);

            // If only one of start/end is valid, mirror to ensure a valid range
            if (!start && end) start = end;
            if (!end && start) end = start;
            // Skip rows with no valid dates at all
            if (!start && !end) continue;

            const baseItem = {
                id: idx.id >= 0 ? String(r[idx.id]) : `item_${tasks.length + milestones.length}`,
                name: idx.name >= 0 ? String(r[idx.name] ?? '') : '',
                phase: idx.phase >= 0 ? String(r[idx.phase] ?? '') : '',
                start: (start as Date),
            };

            if (isMs) {
                milestones.push({
                    id: baseItem.id,
                    name: baseItem.name,
                    date: baseItem.start,
                    phase: baseItem.phase
                });
            } else {
                tasks.push({
                    ...baseItem,
                    end: (end as Date),
                    progress: idx.progress >= 0 && r[idx.progress] != null ? Number(r[idx.progress]) : 0,
                    dependencies: dependencies
                });
            }
        }
        
        return {
            tasks,
            milestones,
            dependencies: []
        };
    }
}
