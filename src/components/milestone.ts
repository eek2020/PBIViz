import * as d3 from 'd3';
import { VisualSettings } from '../settings';
import { Task } from '../data/interfaces';

export class MilestoneRenderer {
    private container: d3.Selection<SVGGElement, undefined, SVGSVGElement, undefined>;
    private settings: VisualSettings;
    private xScale: d3.ScaleTime<number, number>;
    private yScale: d3.ScaleBand<string>;
    
    // Milestone colors based on reference visuals
    private milestoneColors = {
        diamond: '#FFD700',  // Gold for regular milestones
        star: '#FF6347',     // Tomato red for important milestones
        default: '#FFA500'   // Orange fallback
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
        // Clear previous milestones
        this.container.selectAll('.milestone-group').remove();
        
        // Filter milestone tasks
        const milestones = tasks.filter(t => t.milestone);
        
        if (milestones.length === 0) return;

        // Create milestone groups
        const milestoneGroups = this.container.selectAll('.milestone-group')
            .data(milestones)
            .enter()
            .append('g')
            .attr('class', 'milestone-group')
            .attr('transform', d => {
                const x = this.xScale(d.startDate);
                const y = (this.yScale(d.id) || 0) + this.yScale.bandwidth() / 2;
                return `translate(${x}, ${y})`;
            });

        // Determine milestone type and render appropriate shape
        milestoneGroups.each((d, i, nodes) => {
            const group = d3.select(nodes[i]) as any;
            const isImportant = this.isImportantMilestone(d);
            
            if (isImportant) {
                this.renderStarMilestone(group, d);
            } else {
                this.renderDiamondMilestone(group, d);
            }
            
            this.renderMilestoneLabel(group, d);
        });
    }
    
    private renderDiamondMilestone(group: d3.Selection<SVGGElement, Task, any, any>, task: Task): void {
        const size = 12;
        
        // Create diamond path
        const diamondPath = `M 0,-${size} L ${size},0 L 0,${size} L -${size},0 Z`;
        
        group.append('path')
            .attr('class', 'milestone-diamond')
            .attr('d', diamondPath)
            .style('fill', this.milestoneColors.diamond)
            .style('stroke', '#DAA520') // Darker gold border
            .style('stroke-width', 2)
            .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
    }
    
    private renderStarMilestone(group: d3.Selection<SVGGElement, Task, any, any>, task: Task): void {
        const size = 10;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        const points = 5;
        
        // Create star path
        let starPath = '';
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle - Math.PI / 2) * radius;
            const y = Math.sin(angle - Math.PI / 2) * radius;
            
            if (i === 0) {
                starPath += `M ${x},${y}`;
            } else {
                starPath += ` L ${x},${y}`;
            }
        }
        starPath += ' Z';
        
        group.append('path')
            .attr('class', 'milestone-star')
            .attr('d', starPath)
            .style('fill', this.milestoneColors.star)
            .style('stroke', '#CD5C5C') // Darker red border
            .style('stroke-width', 2)
            .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
    }
    
    private renderMilestoneLabel(group: d3.Selection<SVGGElement, Task, any, any>, task: Task): void {
        // Add milestone label with background
        const labelGroup = group.append('g')
            .attr('class', 'milestone-label-group')
            .attr('transform', 'translate(18, -8)');
            
        const text = labelGroup.append('text')
            .attr('class', 'milestone-label')
            .attr('x', 4)
            .attr('y', 12)
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .style('fill', '#333')
            .text(task.name);
            
        // Get text dimensions for background
        const bbox = (text.node() as SVGTextElement)?.getBBox();
        if (bbox) {
            labelGroup.insert('rect', 'text')
                .attr('class', 'milestone-label-bg')
                .attr('x', bbox.x - 2)
                .attr('y', bbox.y - 1)
                .attr('width', bbox.width + 4)
                .attr('height', bbox.height + 2)
                .attr('rx', 3)
                .attr('ry', 3)
                .style('fill', 'rgba(255,255,255,0.9)')
                .style('stroke', '#ddd')
                .style('stroke-width', 1);
        }
    }
    
    private isImportantMilestone(task: Task): boolean {
        // Determine if milestone should be rendered as star (important) or diamond (regular)
        // Based on task name keywords or progress completion
        const importantKeywords = ['completion', 'delivery', 'release', 'launch', 'final', 'go-live'];
        const taskNameLower = task.name.toLowerCase();
        
        return importantKeywords.some(keyword => taskNameLower.includes(keyword)) || 
               task.progress === 100;
    }
}
