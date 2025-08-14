export interface Task {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    phase?: string;
    milestone?: boolean;
    dependencies?: string[];
    progress?: number;
}

export interface Phase {
    name: string;
    color?: string;
}

export interface GanttData {
    tasks: Task[];
    phases: Phase[];
    startDate: Date;
    endDate: Date;
}
