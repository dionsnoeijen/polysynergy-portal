# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PolySynergy Portal is a Next.js web application that provides a visual node-based editor for creating and managing automation workflows. The application uses a canvas-based editor where users can create nodes, connect them together, and build complex automation pipelines.

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
next build

# Start production server
next start

# Run linter
next lint
```

## Architecture

### Core Technologies
- **Next.js 15.3.0** with App Router
- **React 19** with TypeScript
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Konva.js** and **react-konva** for future canvas drawing features
- **OIDC** authentication with AWS Cognito
- **WebSocket** connections for real-time features

### State Management Pattern
The application uses Zustand stores for different domains:
- `editorStore` - Main editor state (zoom, pan, selections, forms)
- `nodesStore` - Node management and operations
- `connectionsStore` - Connection management between nodes
- `projectsStore`, `blueprintsStore`, `schedulesStore` - Data entities

### Key Architecture Components

#### Visual Editor (`src/components/editor/`)
- **Node System**: DOM-based nodes positioned absolutely representing workflow steps
- **Connection System**: Custom SVG elements for visual connections between node variables
- **Canvas System**: Konva.js integration planned for future drawing features
- **Group System**: Nodes can be grouped and collapsed

#### Authentication (`src/contexts/auth-context.tsx`)
- Uses OIDC with AWS Cognito
- Requires environment variables for Cognito configuration
- Handles token management through `src/api/auth/authToken.ts`

#### API Layer (`src/api/`)
- RESTful API calls to backend services
- Uses bearer token authentication with `getIdToken()` from `@/api/auth/authToken`
- Base URL: `config.LOCAL_API_URL` (not `config.API_BASE_URL`)
- Organized by domain (projects, nodes, blueprints, etc.)

## Key File Locations

### Editor Core
- `src/components/editor/editor.tsx` - Main editor component
- `src/stores/editorStore.ts` - Central editor state management
- `src/components/editor/nodes/node.tsx` - Individual node rendering

### Type Definitions
- `src/types/types.ts` - Comprehensive type definitions for the entire application

### Visual Components
- `src/components/editor/nodes/` - Node rendering components
- `src/components/editor/forms/` - Form components for editing
- `src/components/editor/sidebars/` - Sidebar panels and trees

## Environment Configuration

Required environment variables (see `next.config.ts`):
- `NEXT_PUBLIC_AWS_COGNITO_AUTHORITY`
- `NEXT_PUBLIC_AWS_COGNITO_DOMAIN`
- `NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_AWS_COGNITO_LOGOUT_URL`
- `NEXT_PUBLIC_AWS_COGNITO_REDIRECT_URL`
- `NEXT_PUBLIC_POLYSYNERGY_API`
- `NEXT_PUBLIC_POLYSYNERGY_WEBSOCKET_URL`

## API Development Patterns

### Authentication
Always use the `getIdToken()` function for API authentication:

```typescript
import { getIdToken } from '@/api/auth/authToken';

const response = await fetch(`${config.LOCAL_API_URL}/endpoint?project_id=${projectId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getIdToken()}`,
  },
  body: JSON.stringify(data)
});
```

**Common API Mistakes to Avoid:**
- ❌ `authToken.getToken()` - authToken object doesn't exist
- ❌ `config.API_BASE_URL` - use `config.LOCAL_API_URL` instead
- ❌ `'X-Project-ID': projectId` - use query parameter instead
- ✅ `getIdToken()` - correct function to use
- ✅ `config.LOCAL_API_URL` - correct base URL
- ✅ `?project_id=${projectId}` - project ID as query parameter

### API Client Pattern
Follow this pattern for API clients:

```typescript
export function createSomeApi(projectId: string) {
  const baseUrl = `${config.LOCAL_API_URL}/some-endpoint`;
  
  return {
    async getResource(id: string) {
      const response = await fetch(`${baseUrl}/${id}?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${getIdToken()}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.statusText}`);
      }
      
      return response.json();
    }
  };
}
```

### Error Handling
- Always check `response.ok` before parsing JSON
- Provide meaningful error messages
- Use try/catch in components when calling APIs

## Code Patterns

### Component Architecture Standard
Follow this pattern for complex components (see `NodeRowsRefactored` as reference):

**1. Extract Logic to Custom Hooks**
```typescript
// Separate concerns into focused hooks
const commonLogic = useComponentCommonLogic(props);
const styling = useComponentStyling(props, commonLogic);
const interactions = useComponentInteractions(props, commonLogic);
```

**2. Create Focused Sub-components**
```typescript
// Split large components into single-responsibility pieces
- ComponentContainer (positioning, base logic)
- ComponentStateA (specific state rendering)
- ComponentStateB (alternative state rendering)
```

**3. Clean Orchestrator Pattern**
```typescript
// Main component becomes simple coordinator (20-40 lines)
const MainComponent = (props) => {
  const logic = useComponentLogic(props);
  const styles = useComponentStyling(props, logic);
  const interactions = useComponentInteractions(props, logic);
  
  return (
    <ComponentContainer {...baseProps}>
      {logic.condition ? (
        <StateA {...stateProps} />
      ) : (
        <StateB {...stateProps} />
      )}
    </ComponentContainer>
  );
};
```

**4. Performance Optimizations**
- Use `useMemo` for expensive calculations
- Use stable event handlers (avoid inline functions)
- Extract constants outside components
- Memoize style objects and class names

### State Updates
Always use Zustand store actions rather than direct state mutations:
```typescript
// Good
useEditorStore.getState().setSelectedNodes([nodeId]);

// Bad
useEditorStore.getState().selectedNodes.push(nodeId);
```

### Node Variable Types
Use the `NodeVariableType` enum for variable types. Common types include:
- `String`, `Number`, `Boolean` - Basic types
- `Dict`, `List` - Complex data structures
- `Code`, `Json`, `Template` - Special editor types
- `Files`, `SecretString` - File and security types

### Form Management
Forms are managed through the editor store:
```typescript
// Open a form
useEditorStore.getState().openForm(FormType.EditNode, nodeId);

// Close a form
useEditorStore.getState().closeForm();
```

## Editor Coordinate System

The editor uses absolute positioning with a custom coordinate system:
- **Zoom factor**: Stored in `editorStore.zoomFactor` 
- **Pan position**: Stored in `editorStore.panPosition`
- **Grid snapping**: Utilities in `src/utils/snapToGrid.ts`
- **Node positioning**: Nodes use absolute CSS positioning within the editor container

## WebSocket Integration

Real-time features use WebSocket connections for:
- Live execution logs (`src/websocket/logsSocket.ts`)
- Real-time status updates

## Testing

The project uses TypeScript compilation as the primary validation. Run `next build` to validate the entire codebase for type errors.