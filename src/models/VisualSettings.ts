import { VisualSettings } from '../settings';

// Helper to create a default settings instance compatible with VisualSettings
export function createDefaultSettings(): VisualSettings {
    const settings = new VisualSettings();

    // Phase labels/colors (example defaults)
    settings.phases.labels = {
        Planning: 'Planning',
        Design: 'Design',
        Development: 'Development',
        Testing: 'Testing',
        Deployment: 'Deployment',
    };
    settings.phases.colors = {
        Planning: '#2196F3',
        Design: '#4CAF50',
        Development: '#FF9800',
        Testing: '#9C27B0',
        Deployment: '#00BCD4',
    };

    // Task styling defaults
    settings.tasks.barHeight = 20;
    settings.tasks.spacing = 10;

    // Timeline defaults
    settings.timeline.showGrid = true;

    // Dependency/milestone defaults are already set by class initializers

    return settings;
}
