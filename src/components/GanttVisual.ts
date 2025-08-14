import * as d3 from 'd3';
import { VisualSettings } from '../settings';
import { IGanttTask, ITask } from '../models/GanttData';
import { Task } from '../data/interfaces';
import { Timeline } from './timeline';
import { TaskRenderer } from './task';
import { MilestoneRenderer } from './milestone';
import { DependencyRenderer } from './dependency';
import { PhaseConfig } from './PhaseConfig';

export class GanttVisual {
    private container: HTMLElement;
    private settings: VisualSettings;
    private phaseConfig: PhaseConfig;
    private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    private mainGroup!: d3.Selection<SVGGElement, unknown, any, any>;
    private taskListGroup!: d3.Selection<SVGGElement, unknown, any, any>;
    private chartGroup!: d3.Selection<SVGGElement, unknown, any, any>;
    private timelineContainer!: d3.Selection<SVGGElement, unknown, any, any>;
    private taskContainer!: d3.Selection<SVGGElement, unknown, any, any>;
    private milestoneContainer!: d3.Selection<SVGGElement, unknown, any, any>;
    private dependencyContainer!: d3.Selection<SVGGElement, unknown, any, any>;
    private timeline!: Timeline;
    private taskRenderer!: TaskRenderer;
    private milestoneRenderer!: MilestoneRenderer;
    private dependencyRenderer!: DependencyRenderer;
    
    // Track viewport size provided by Power BI
    private viewportWidth: number = 0;
    private viewportHeight: number = 0;

    constructor(target: HTMLElement, settings: VisualSettings, phaseConfig: PhaseConfig) {
        this.container = target;
        this.settings = settings;
        this.phaseConfig = phaseConfig;
        this.initialize();
    }

    private initialize(): void {
        this.svg = d3.select(this.container).append('svg')
            .attr('width', '100%')
            .attr('height', '100%');

        this.mainGroup = this.svg.append('g');
        
        this.taskListGroup = this.mainGroup.append('g')
            .attr('class', 'task-list-group');

        this.chartGroup = this.mainGroup.append('g')
            .attr('class', 'chart-group');

        this.timelineContainer = this.chartGroup.append('g')
            .attr('class', 'timeline-container');

        this.taskContainer = this.chartGroup.append('g')
            .attr('class', 'task-container');

        this.milestoneContainer = this.chartGroup.append('g')
            .attr('class', 'milestone-container');
            
        this.dependencyContainer = this.chartGroup.append('g')
            .attr('class', 'dependency-container');

        this.initializeRenderers();
    }

    private initializeRenderers(): void {
        const width = this.viewportWidth || this.container.clientWidth || 0;
        const height = this.viewportHeight || this.container.clientHeight || 0;

        this.timeline = new Timeline(this.timelineContainer, width, height, this.settings);
        // Note: Renderers will be initialized in render() method when scales are available
    }

    // Allow the host visual to provide viewport dimensions
    public setViewport(width: number, height: number): void {
        this.viewportWidth = Math.max(0, Math.floor(width));
        this.viewportHeight = Math.max(0, Math.floor(height));
        if (this.svg) {
            this.svg.attr('width', this.viewportWidth).attr('height', this.viewportHeight);
        }
    }

    public render(ganttData: IGanttTask): void {
        this.clear();

        // Always render a background to confirm visual is active
        this.svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', '#fafafa')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1);

        // Ensure SVG matches viewport
        if (this.viewportWidth && this.viewportHeight) {
            this.svg.attr('width', this.viewportWidth).attr('height', this.viewportHeight);
        }

        // Basic diagnostics for missing data or zero-size viewport
        const hasData = !!ganttData && !!ganttData.tasks && ganttData.tasks.length > 0;
        const width = this.viewportWidth || this.container.clientWidth || 400;
        const height = this.viewportHeight || this.container.clientHeight || 300;
        
        // Always show status
        this.svg.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .attr('fill', '#333')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(`Gantt Status: ${hasData ? ganttData.tasks.length + ' tasks' : 'No data'} | Viewport: ${width}x${height}`);
        
        if (!hasData) {
            this.renderDiagnostic(`No parsed tasks to render`);
            return;
        }
        if (width === 0 || height === 0) {
            this.renderDiagnostic(`Zero-size viewport (${width}x${height})`);
            return;
        }

        const { tasks, milestones, dependencies } = ganttData;
        const { timeScale, yScale, chartWidth, chartHeight } = this.createScales(tasks);
        
        // Clamp task-list width to viewport to avoid pushing chart off-canvas
        const taskListWidth = Math.min(200, Math.max(100, (this.viewportWidth || this.container.clientWidth || 300) * 0.3));

        this.mainGroup.attr('transform', `translate(0, 0)`);
        this.taskListGroup.attr('transform', `translate(0, 60)`); // Position below timeline header
        this.chartGroup.attr('transform', `translate(${taskListWidth}, 0)`);

        // Root-level debug overlay always visible
        this.svg.selectAll('.debug-root').remove();
        this.svg.append('text')
            .attr('class', 'debug-root')
            .attr('x', 8)
            .attr('y', 16)
            .attr('fill', '#888')
            .attr('font-size', '11px')
            .text(`[Gantt] tasks=${tasks.length}, ms=${milestones.length}, vp=${this.viewportWidth || this.container.clientWidth}x${this.viewportHeight || this.container.clientHeight}`);

    // Initialize renderers with scales
    this.taskRenderer = new TaskRenderer(this.taskContainer as any, this.settings, timeScale, yScale);
    this.milestoneRenderer = new MilestoneRenderer(this.milestoneContainer as any, this.settings, timeScale, yScale);
    this.dependencyRenderer = new DependencyRenderer(this.dependencyContainer as any, this.settings, timeScale, yScale);

        this.timeline.render(timeScale);

        // Debug: visualize chart drawing area and basic metrics
        this.chartGroup.append('rect')
            .attr('class', 'debug-area')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', chartWidth)
            .attr('height', chartHeight)
            .style('fill', 'none')
            .style('stroke', '#f44336')
            .style('stroke-dasharray', '4,2')
            .style('opacity', 0.6);
        this.chartGroup.append('text')
            .attr('x', 8)
            .attr('y', 14)
            .attr('fill', '#f44336')
            .attr('font-size', '11px')
            .text(`debug: tasks=${tasks.length}, milestones=${milestones.length}, size=${chartWidth}x${chartHeight}`);

        this.renderTaskList(tasks, yScale);
        // Convert ITask[] to Task[]
        const mappedTasks: Task[] = tasks.map(task => ({
            id: task.id,
            name: task.name,
            startDate: task.start,
            endDate: task.end,
            phase: task.phase || '',
            milestone: false,
            dependencies: task.dependencies || [],
            progress: task.progress || 0
        }));

        // Convert IMilestone[] to Task[]
        const mappedMilestones: Task[] = milestones.map(milestone => ({
            id: milestone.id,
            name: milestone.name,
            startDate: milestone.date,
            endDate: milestone.date, // Same as startDate for milestones
            phase: milestone.phase || '',
            milestone: true,
            dependencies: [],
            progress: 0
        }));

        const allTasks = [...mappedTasks, ...mappedMilestones];

        this.taskRenderer.render(mappedTasks);
        this.milestoneRenderer.render(mappedMilestones);
        this.dependencyRenderer.render(allTasks);
    }

    private createScales(tasks: ITask[]): { timeScale: d3.ScaleTime<number, number>, yScale: d3.ScaleBand<string>, chartWidth: number, chartHeight: number } {
        const taskListWidth = 200;
        const containerWidth = this.viewportWidth || this.container.clientWidth || 0;
        const containerHeight = this.viewportHeight || this.container.clientHeight || 0;
        const chartWidth = Math.max(0, containerWidth - taskListWidth);
        const chartHeight = Math.max(0, containerHeight - 60); // Adjust for timeline header

        const minDate = d3.min(tasks, d => d.start) as Date | undefined;
        const maxDate = d3.max(tasks, d => d.end) as Date | undefined;

        // Guard invalid domain; create a 1-day span around the single date if needed
        let domainStart = minDate;
        let domainEnd = maxDate;
        if (!domainStart && !domainEnd) {
            const today = new Date();
            domainStart = today; domainEnd = new Date(today.getTime() + 86400000);
        } else if (domainStart && !domainEnd) {
            domainEnd = new Date(domainStart.getTime() + 86400000);
        } else if (!domainStart && domainEnd) {
            domainStart = new Date(domainEnd.getTime() - 86400000);
        } else if (domainStart && domainEnd && domainEnd <= domainStart) {
            domainEnd = new Date(domainStart.getTime() + 3600000); // +1h
        }

        const timeScale = d3.scaleTime()
            .domain([domainStart!, domainEnd!])
            .range([0, chartWidth]);

        const paddingRatio = Math.max(0, Math.min(0.49, this.settings.layout.padding / Math.max(1, this.settings.layout.rowHeight)));
        const yScale = d3.scaleBand<string>()
            .domain(tasks.map(t => t.id))
            .range([0, chartHeight])
            .padding(paddingRatio);
            
        return { timeScale, yScale, chartWidth, chartHeight };
    }

    private renderTaskList(tasks: ITask[], yScale: d3.ScaleBand<string>): void {
        const taskLabels = this.taskListGroup.selectAll('.task-label')
            .data(tasks as any, (d: any) => d.id);

        taskLabels.enter()
            .append('text')
            .attr('class', 'task-label')
            .attr('y', (d: any) => yScale(d.id)! + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .text((d: any) => d.name)
            .style('font-family', this.settings.font.fontFamily)
            .style('font-size', `${this.settings.font.fontSize}px`);

        taskLabels.exit().remove();
    }

    private clear(): void {
        this.taskListGroup.selectAll('*').remove();
        this.timelineContainer.selectAll('*').remove();
        this.taskContainer.selectAll('*').remove();
        this.milestoneContainer.selectAll('*').remove();
        this.dependencyContainer.selectAll('*').remove();
    }

    private renderDiagnostic(message: string): void {
        // Simple overlay to aid debugging in Service/Desktop when nothing renders
        this.svg.append('text')
            .attr('x', 12)
            .attr('y', 18)
            .attr('fill', '#888')
            .attr('font-size', '12px')
            .text(`[Gantt] ${message}`);
    }
}
