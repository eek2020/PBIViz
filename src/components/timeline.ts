import * as d3 from 'd3';
import { VisualSettings } from '../settings';

export class Timeline {
    public container: d3.Selection<SVGGElement, unknown, SVGGElement, undefined>;
    private settings: VisualSettings;
    private width: number;
    private height: number;
    private timeScale!: d3.ScaleTime<number, number>;
    private margin = { top: 20, right: 20, bottom: 30, left: 40 };

    constructor(container: d3.Selection<SVGGElement, unknown, SVGGElement, undefined>, width: number, height: number, settings: VisualSettings) {
        this.container = container;
        this.width = width;
        this.height = height;
        this.settings = settings;
    }

    public render(timeScale: d3.ScaleTime<number, number>): void {
        this.timeScale = timeScale;
        this.container.selectAll('*').remove();

        this.renderTimelineHeaders();
        this.renderGridLines();
    }

    private renderTimelineHeaders(): void {
        const headerGroup = this.container.append('g')
            .attr('class', 'timeline-headers');

        const months = this.generateMonths();
        headerGroup.selectAll('.month-header')
            .data(months)
            .enter()
            .append('text')
            .attr('class', 'month-header')
            .attr('x', d => this.timeScale(d.start)! + (this.timeScale(d.end)! - this.timeScale(d.start)!) / 2)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .text(d => d.label);
    }

    private renderGridLines(): void {
        if (!this.settings.timeline.showGrid) return;
        
        const gridGroup = this.container.append('g')
            .attr('class', 'grid-lines')
            .attr('transform', 'translate(0, 60)');
            
        const months = this.generateMonths();
        gridGroup.selectAll('.grid-line')
            .data(months)
            .enter()
            .append('line')
            .attr('class', 'grid-line')
            .attr('x1', d => this.timeScale(d.start)!)
            .attr('x2', d => this.timeScale(d.start)!)
            .attr('y1', 0)
            .attr('y2', this.height - this.margin.top - this.margin.bottom - 60)
            .attr('stroke', '#e0e0e0')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2');
    }

    private generateMonths(): Array<{start: Date, end: Date, label: string}> {
        const [start, end] = this.timeScale.domain();
        const months: Array<{start: Date, end: Date, label: string}> = [];
        let current = new Date(start);

        while (current <= end) {
            const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
            const nextMonthStart = new Date(current.getFullYear(), current.getMonth() + 1, 1);
            months.push({
                start: monthStart,
                end: nextMonthStart,
                label: d3.timeFormat('%b')(monthStart)
            });
            current = nextMonthStart;
        }
        return months;
    }
}
