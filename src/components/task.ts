import * as d3 from 'd3';
import { VisualSettings } from '../settings';
import { Task } from '../data/interfaces';

export class TaskRenderer {
    private container: d3.Selection<SVGGElement, undefined, SVGSVGElement, undefined>;
    private settings: VisualSettings;
    private xScale: d3.ScaleTime<number, number>;
    private yScale: d3.ScaleBand<string>;

    // Phase color mapping based on reference visuals
    private phaseColors: { [key: string]: string } = {
        'Phase A': '#8B4513',     // Brown for requirements
        'Phase B': '#4682B4',     // Steel blue for design
        'Phase C': '#CD853F',     // Peru for development
        'Phase D': '#9370DB',     // Medium purple for testing
        'REQUIREMENTS': '#8B4513',
        'DESIGN': '#4682B4',
        'DEVELOPMENT': '#CD853F',
        'TESTING': '#9370DB',
        'default': '#666666'
    };

    constructor(
        container: d3.Selection<SVGGElement, undefined, SVGSVGElement, undefined>,
        settings: VisualSettings,
        xScale: d3.ScaleTime<number, number>,
        yScale: d3.ScaleBand<string>
    ) {
        this.container = container;
        this.settings = settings;
        this.xScale = xScale;
        this.yScale = yScale;
    }

    public render(tasks: Task[]): void {
        this.container.selectAll('.task-group').remove();

        const taskGroups = this.container.selectAll('.task-group')
            .data(tasks)
            .enter()
            .append('g')
            .attr('class', 'task-group')
            .attr('transform', d => `translate(0, ${this.yScale(d.id) || 0})`);

        const barHeight = this.yScale.bandwidth() * (this.settings.layout.barHeight / 100);
        const barY = (this.yScale.bandwidth() - barHeight) / 2;

        taskGroups.append('rect')
            .attr('class', 'task-bar-bg')
            .attr('x', d => this.xScale(d.startDate))
            .attr('y', barY)
            .attr('width', d => Math.max(0, this.xScale(d.endDate) - this.xScale(d.startDate)))
            .attr('height', barHeight)
            .attr('rx', 3)
            .attr('ry', 3)
            .style('fill', d => this.getTaskColor(d.phase))
            .style('stroke', d => d3.color(this.getTaskColor(d.phase))?.darker(0.3)?.toString() || '#333')
            .style('stroke-width', 1)
            .style('opacity', 0.8);

        taskGroups.filter(d => d.progress > 0)
            .append('rect')
            .attr('class', 'progress-bar')
            .attr('x', d => this.xScale(d.startDate))
            .attr('y', barY)
            .attr('width', d => {
                const totalWidth = this.xScale(d.endDate) - this.xScale(d.startDate);
                return Math.max(0, totalWidth * (d.progress / 100));
            })
            .attr('height', barHeight)
            .attr('rx', 3)
            .attr('ry', 3)
            .style('fill', d => d3.color(this.getTaskColor(d.phase))?.darker(0.5)?.toString() || '#333')
            .style('opacity', 0.9);

        taskGroups.append('text')
            .attr('class', 'task-label')
            .attr('x', d => this.xScale(d.startDate) + 8)
            .attr('y', this.yScale.bandwidth() / 2)
            .attr('dominant-baseline', 'middle')
            .attr('font-size', `${this.settings.font.fontSize}px`)
            .attr('font-weight', '500')
            .style('fill', 'white')
            .style('text-shadow', '1px 1px 1px rgba(0,0,0,0.5)')
            .text(d => {
                const availableWidth = this.xScale(d.endDate) - this.xScale(d.startDate) - 16;
                return this.truncateText(d.name, availableWidth);
            });

        // Add progress percentage text for tasks with progress
        taskGroups.filter(d => d.progress > 0)
            .append('text')
            .attr('class', 'progress-text')
            .attr('x', d => {
                const barStart = this.xScale(d.startDate);
                const barWidth = this.xScale(d.endDate) - barStart;
                return barStart + barWidth - 25;
            })
            .attr('y', this.yScale.bandwidth() / 2 + 4)
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .style('fill', 'white')
            .style('text-shadow', '1px 1px 1px rgba(0,0,0,0.7)')
            .text(d => `${Math.round(d.progress)}%`);
    }

    private getTaskColor(phase: string): string {
        const upperPhase = phase.toUpperCase();
        return this.phaseColors[upperPhase] || this.phaseColors[phase] || this.phaseColors.default;
    }
    
    private truncateText(text: string, maxWidth: number): string {
        if (maxWidth < 30) return ''; // Too narrow to show text
        
        // Rough character width estimation (8px per character)
        const maxChars = Math.floor(maxWidth / 8);
        
        if (text.length <= maxChars) {
            return text;
        }
        
        return text.substring(0, maxChars - 3) + '...';
    }
}
