import { VisualSettings } from '../settings';

export class PhaseConfig {
    private settings: VisualSettings;

    constructor(settings: VisualSettings = new VisualSettings()) {
        this.settings = settings;
    }

    public getPhases(): string[] {
        const labelKeys = Object.keys(this.settings.phases.labels || {});
        const colorKeys = Object.keys(this.settings.phases.colors || {});
        // Union of keys from labels and colors
        return Array.from(new Set([...labelKeys, ...colorKeys]));
    }

    public getPhaseLabel(phaseKey: string): string {
        return (this.settings.phases.labels && this.settings.phases.labels[phaseKey]) || phaseKey;
    }

    public getPhaseColor(phaseKey: string): string {
        return (this.settings.phases.colors && this.settings.phases.colors[phaseKey]) || '#CCCCCC';
    }

    // Rename means: update the display label for an existing phase key
    public renamePhase(phaseKey: string, newLabel: string): void {
        if (!this.settings.phases.labels) this.settings.phases.labels = {};
        this.settings.phases.labels[phaseKey] = newLabel;
    }

    public addPhase(phaseKey: string, color: string = '#CCCCCC', label?: string): void {
        if (!this.settings.phases.colors) this.settings.phases.colors = {};
        if (!this.settings.phases.labels) this.settings.phases.labels = {};
        this.settings.phases.colors[phaseKey] = color;
        this.settings.phases.labels[phaseKey] = label || phaseKey;
    }

    public removePhase(phaseKey: string): void {
        if (this.settings.phases.colors && phaseKey in this.settings.phases.colors) {
            delete this.settings.phases.colors[phaseKey];
        }
        if (this.settings.phases.labels && phaseKey in this.settings.phases.labels) {
            delete this.settings.phases.labels[phaseKey];
        }
    }

    public updateSettings(): VisualSettings {
        return this.settings;
    }
}
