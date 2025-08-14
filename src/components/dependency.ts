import * as d3 from 'd3';
import { VisualSettings } from '../settings';
import { Task, Dependency, DependencyType } from '../data/interfaces';

export class DependencyRenderer {
    private container: d3.Selection<SVGGElement, undefined, SVGSVGElement, undefined>;
    private settings: VisualSettings;
    private xScale: d3.ScaleTime<number, number>;
    private yScale: d3.ScaleBand<string>;
    private taskMap: Map<string, Task>;

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
        this.taskMap = new Map();
    }

    public render(tasks: Task[]): void {
        // Clear previous dependencies
        this.container.selectAll('.dependency-group').remove();
        
        // Create task map for quick lookup
        this.taskMap.clear();
        tasks.forEach(task => this.taskMap.set(task.id, task));

        // Extract dependencies from tasks
        const dependencies = this.extractDependencies(tasks);
        
        if (dependencies.length === 0) return;

        // Create dependency groups
        const dependencyGroups = this.container.selectAll('.dependency-group')
            .data(dependencies)
            .enter()
            .append('g')
            .attr('class', 'dependency-group');

        // Add dependency lines with dotted style
        dependencyGroups.append('path')
            .attr('class', 'dependency-line')
            .attr('d', d => this.getDependencyPath(d))
            .style('stroke', '#666')
            .style('stroke-width', 2)
            .style('stroke-dasharray', '5,5')
            .style('fill', 'none')
            .style('opacity', 0.7);

        // Add arrowheads
        dependencyGroups.append('path')
            .attr('class', 'dependency-arrow')
            .attr('d', d => this.getArrowPath(d))
            .style('fill', '#666')
            .style('opacity', 0.7);
    }

    private extractDependencies(tasks: Task[]): Array<{sourceId: string, targetId: string}> {
        const dependencies: Array<{sourceId: string, targetId: string}> = [];
        
        tasks.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(depId => {
                    if (this.taskMap.has(depId)) {
                        dependencies.push({
                            sourceId: depId,
                            targetId: task.id
                        });
                    }
                });
            }
        });
        
        return dependencies;
    }

    private getDependencyPath(dependency: {sourceId: string, targetId: string}): string {
        const sourceTask = this.taskMap.get(dependency.sourceId);
        const targetTask = this.taskMap.get(dependency.targetId);

        if (!sourceTask || !targetTask) return '';

        // Source point (end of source task)
        const sourceX = this.xScale(sourceTask.endDate);
        const sourceY = (this.yScale(sourceTask.id) ?? 0) + (this.yScale.bandwidth() / 2);
        
        // Target point (start of target task)
        const targetX = this.xScale(targetTask.startDate);
        const targetY = (this.yScale(targetTask.id) ?? 0) + (this.yScale.bandwidth() / 2);

        // Create L-shaped path (finish-to-start dependency)
        const midX = sourceX + 20; // Small offset from source
        
        if (Math.abs(sourceY - targetY) < 5) {
            // Same row - simple horizontal line
            return `M${sourceX},${sourceY} L${targetX - 8},${targetY}`;
        } else {
            // Different rows - L-shaped connector
            return `M${sourceX},${sourceY} L${midX},${sourceY} L${midX},${targetY} L${targetX - 8},${targetY}`;
        }
    }
    
    private getArrowPath(dependency: {sourceId: string, targetId: string}): string {
        const sourceTask = this.taskMap.get(dependency.sourceId);
        const targetTask = this.taskMap.get(dependency.targetId);

        if (!sourceTask || !targetTask) return '';

        const targetX = this.xScale(targetTask.startDate);
        const targetY = (this.yScale(targetTask.id) ?? 0) + (this.yScale.bandwidth() / 2);
        
        // Create arrowhead pointing right
        const arrowSize = 6;
        return `M${targetX - arrowSize},${targetY - arrowSize/2} L${targetX},${targetY} L${targetX - arrowSize},${targetY + arrowSize/2} Z`;
    }


}
