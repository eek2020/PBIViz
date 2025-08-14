# Power BI Gantt Chart Custom Visual

A custom Power BI visual that displays project timelines with milestones, tasks, dependencies, and configurable phases.

## Features

- Gantt chart visualization
- Milestones display
- Task bars with progress
- Dependency visualization
- Configurable phase names
- Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start development server:
```bash
npm start
```

## Data Requirements

The visual expects data in the following format:
- Task Name
- Start Date
- End Date
- Phase (optional)
- Milestone (boolean)
- Dependencies (array of task names)
- Progress (0-100)

## Configuration

- Phases can be renamed through the visual settings
- Colors can be customized
- Font sizes and spacing are configurable

## Development

- TypeScript for type safety
- D3.js for visualization
- Power BI Visuals API for integration
- Jest for testing
