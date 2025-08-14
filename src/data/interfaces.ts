export interface Task {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    phase: string;
    milestone: boolean;
    dependencies: string[];
    progress: number;
}

export interface Phase {
    id: string;
    name: string;
    color: string;
    label: string;
}

export interface Dependency {
    sourceId: string;
    targetId: string;
    type: DependencyType;
}

export enum DependencyType {
    FinishToStart = 'FinishToStart',
    StartToStart = 'StartToStart',
    FinishToFinish = 'FinishToFinish',
    StartToFinish = 'StartToFinish'
}
