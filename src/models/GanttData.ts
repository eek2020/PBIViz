export interface ITask {
    dependencies?: string[];
    id: string;
    name: string;
    start: Date;
    end: Date;
    phase?: string;
    progress?: number;
}

export interface IMilestone {
    id: string;
    name: string;
    date: Date;
    phase?: string;
}

export interface IDependency {
    id: string;
    fromTaskId: string;
    toTaskId: string;
    type?: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
}

export interface IGanttTask {
    tasks: ITask[];
    milestones: IMilestone[];
    dependencies: IDependency[];
}

export interface IPhase {
    id: string;
    name: string;
    color: string;
}
