# Gantt Visual Architecture Overview

## Project Structure

```
gantt-chart-powerbi/
├── src/
│   ├── visual.ts                 # Main entry point (Power BI API interface)
│   ├── settings.ts               # Visual settings/configuration classes
│   ├── components/
│   │   ├── GanttVisual.ts       # Main visual orchestrator
│   │   ├── task.ts              # Task bar renderer
│   │   ├── milestone.ts         # Milestone renderer
│   │   ├── timeline.ts          # Timeline header renderer
│   │   ├── dependency.ts        # Dependency line renderer
│   │   └── PhaseConfig.ts       # Phase color/label management
│   ├── models/
│   │   ├── GanttData.ts         # Data interfaces (ITask, IMilestone, etc.)
│   │   ├── Task.ts              # Additional task interfaces
│   │   └── VisualSettings.ts    # Settings model
│   └── data/
│       └── interfaces.ts        # Shared data interfaces
├── capabilities.json             # Power BI data role mappings
├── pbiviz.json                  # Visual metadata
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies
└── style/
    └── visual.less              # Visual styling
```

## Component Architecture

### 1. Visual Entry Point (`src/visual.ts`)
- **Class**: `Visual`
- **Purpose**: Power BI API interface
- **Responsibilities**:
  - Receives data from Power BI (`update()` method)
  - Converts Power BI DataView to internal format
  - Manages viewport sizing
  - Instantiates and coordinates GanttVisual

### 2. Main Orchestrator (`src/components/GanttVisual.ts`)
- **Class**: `GanttVisual`
- **Purpose**: Coordinate all rendering components
- **Key Methods**:
  - `render()`: Main rendering pipeline
  - `createScales()`: Create D3 time/band scales
  - `setViewport()`: Handle Power BI viewport sizing
- **Child Components**:
  - TaskRenderer
  - MilestoneRenderer
  - TimelineRenderer
  - DependencyRenderer

### 3. Renderer Components

#### TaskRenderer (`task.ts`)
- Renders horizontal task bars
- Shows progress percentage
- Applies phase colors
- Handles task labels

#### MilestoneRenderer (`milestone.ts`)
- Renders milestone diamonds/stars
- Positions at specific dates
- Applies phase colors

#### Timeline (`timeline.ts`)
- Renders month headers
- Creates grid lines
- Manages time axis

#### DependencyRenderer (`dependency.ts`)
- Draws L-shaped connector lines
- Links dependent tasks
- Renders arrowheads

## Data Flow

```
Power BI DataView
    ↓
Visual.converter() [Table mapping]
    ↓
IGanttTask { tasks[], milestones[], dependencies[] }
    ↓
GanttVisual.render()
    ↓
D3 Scales (time, band)
    ↓
Individual Renderers → SVG Elements
```

## Data Mapping

### Power BI Roles (capabilities.json)
- `id`: Task identifier
- `name`: Task/milestone name
- `phase`: Phase grouping
- `startDate`: Start date
- `endDate`: End date
- `milestone`: Boolean flag
- `dependencies`: Related task IDs
- `progress`: Completion percentage

### Internal Data Model
```typescript
interface ITask {
    id: string;
    name: string;
    phase: string;
    start: Date;
    end: Date;
    progress: number;
    dependencies: string[];
}

interface IMilestone {
    id: string;
    name: string;
    date: Date;
    phase: string;
}
```

## Rendering Pipeline

1. **Data Reception**: Power BI sends DataView with table data
2. **Conversion**: Table rows converted to tasks/milestones
3. **Scale Creation**: D3 scales for time (x-axis) and tasks (y-axis)
4. **SVG Setup**: Create/clear SVG groups
5. **Component Rendering**:
   - Timeline headers and grid
   - Task list labels
   - Task bars with progress
   - Milestones
   - Dependency lines
6. **Debug Overlays**: Status messages for troubleshooting

## Key Design Decisions

### Modular Renderer Pattern
Each visual element has its own renderer class, making the code:
- Easier to maintain
- Testable in isolation
- Extensible for new features

### D3.js for Rendering
- Powerful data binding
- Smooth transitions
- Rich scale functions
- SVG manipulation

### Table Data Mapping
- Uses Power BI table format (not categorical)
- More flexible column mapping
- Better for Gantt chart structure

## Common Issues & Solutions

### Issue: Blank Visual
**Causes**:
1. Zero viewport size from Power BI
2. Data conversion failure
3. Build/packaging mismatch

**Solutions**:
- Added viewport size handling
- Robust date parsing
- Debug overlays for diagnostics

### Issue: Missing Dependencies
**Cause**: Dependencies stored as comma-separated strings
**Solution**: Parse and split dependency strings

### Issue: Date Format
**Cause**: Various date formats (dd.mm.yyyy, Excel serial)
**Solution**: Flexible date parser with multiple format support

## Build & Deployment

### Requirements
- Node.js (v18 recommended, v24 works)
- powerbi-visuals-tools 5.2.0 (local)
- Power BI Desktop (Developer Mode)

### Build Commands
```bash
# Install dependencies
npm ci

# Package visual
npx pbiviz package

# Start dev server
npx pbiviz start
```

### Output
- `.pbiviz` file in `dist/` folder
- Import into Power BI Desktop/Service

## Testing Checklist

1. ✅ Visual loads without errors
2. ✅ Data binds to correct roles
3. ✅ Tasks render with correct dates
4. ✅ Milestones appear as diamonds
5. ✅ Dependencies show as lines
6. ✅ Progress bars display
7. ✅ Phase colors apply
8. ✅ Timeline shows months
9. ✅ Viewport resizing works
10. ✅ Debug messages appear when needed

## Future Enhancements

1. **Interactive Features**:
   - Tooltips on hover
   - Click to select/filter
   - Zoom/pan functionality

2. **Additional Visualizations**:
   - Critical path highlighting
   - Resource allocation view
   - Baseline comparison

3. **Performance**:
   - Virtual scrolling for large datasets
   - Progressive rendering
   - Caching optimizations

4. **Customization**:
   - More date format options
   - Custom milestone shapes
   - Configurable dependency styles
