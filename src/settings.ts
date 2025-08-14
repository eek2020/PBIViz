import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public layout: LayoutSettings = new LayoutSettings();
    public font: FontSettings = new FontSettings();
    public phases: PhaseSettings = new PhaseSettings();
    public tasks: TaskSettings = new TaskSettings();
    public timeline: TimelineSettings = new TimelineSettings();
    public dependencies: DependencySettings = new DependencySettings();
    public milestones: MilestoneSettings = new MilestoneSettings();
}

export class LayoutSettings {
    public rowHeight: number = 40;
    public barHeight: number = 25;
    public padding: number = 10;
}

export class FontSettings {
    public fontFamily: string = "Segoe UI";
    public fontSize: number = 12;
}

export class PhaseSettings {
    public labels: { [key: string]: string } = {};
    public colors: { [key: string]: string } = {};
}

export class TaskSettings {
    public barHeight: number = 20;
    public spacing: number = 10;
}

export class TimelineSettings {
    public showGrid: boolean = true;
}

export class DependencySettings {}

export class MilestoneSettings {}
