# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PolySynergy Portal is a Next.js web application that provides a visual node-based editor for creating and managing automation workflows. The application uses a canvas-based editor where users can create nodes, connect them together, and build complex automation pipelines.

## Development Commands

**IMPORTANT**: This application runs in a Docker container and is available at **http://localhost:4000** when running locally.

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

## Production Deployment

**IMPORTANT**: Before deploying to production, always fix TypeScript and ESLint errors:

1. **Run build to check for errors**: `npm run build`
2. **Fix errors pragmatically and immediately**:
   - Comment out unused variables with `//`
   - Replace `any` types with `unknown` 
   - Remove unused imports
   - Fix syntax errors
3. **Common fixes**:
   ```bash
   # Fix unused variables
   find src -name "*.tsx" -exec sed -i '' 's/const unusedVar/\/\/ const unusedVar/g' {} \;
   
   # Fix any types  
   find src -name "*.tsx" -exec sed -i '' 's/: any/: unknown/g' {} \;
   ```
4. **Re-run build** until no errors remain
5. **Never commit broken builds to production**

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

## Published Variables and Play Button System

The Published Variables system allows users to create reusable workflow segments that function like custom functions, with configurable parameters and independent execution capabilities.

### Core Concepts

#### 1. Play Buttons as Function Entry Points
- Nodes can be marked with `has_play_button: true` property
- These become execution entry points for testing workflow segments
- Typically used with `PlayConfig` or `Play` nodes (paths: `polysynergy_nodes.play.config.PlayConfig` or `polysynergy_nodes.play.play.Play`)
- Each play button node creates a dedicated tab in the Published Variables form

#### 2. Publishing Variables (Function Parameters)
Variables can be "published" to expose them as configurable inputs:

**How to publish a variable:**
1. Click the arrow circle icon (`ArrowRightCircleIcon`) next to any variable in the dock
2. This opens the Published Variable Settings form where you can:
   - Toggle the variable as published/unpublished
   - Set a `published_title` (user-friendly display name)
   - Set a `published_description` (HTML description for documentation)
   - For Dict variables, individually select which sub-variables to publish

**Published variable properties:**
- `published: boolean` - Whether the variable is exposed
- `published_title?: string` - Custom display name
- `published_description?: string` - HTML documentation

#### 3. Tab Organization in Published Variables Form

The form automatically organizes variables into tabs:

- **Configuration Tab**: Published variables not connected to any play button
- **Secrets Tab**: Secret nodes requiring stage-specific values
- **Custom Play Tabs**: One per play button node, containing:
  - All published variables that "lead to" that play config node
  - Stage selector dropdown
  - Run button for execution
  - Result display area

#### 4. Variable Routing Logic

The system uses `leadsToPlayConfig()` to determine which tab a variable belongs to:
- Traverses the node graph from any node to find connected PlayConfig/Play nodes
- Uses both input and output connections (bidirectional search)
- Variables are grouped under the play button they connect to
- Orphaned published variables go to the Configuration tab

#### 5. Variable Synchronization

Service nodes enable variable synchronization:
- Variables with same `nodeServiceHandle` and `nodeServiceVariant` are linked
- Changing one synchronized variable updates all instances
- Visual indicator: Link icon shows synchronized variables

#### 6. Special Variable Types

**Secret Variables:**
- Identified by `SECRET_IDENTIFIER = 'secret::internal'`
- Require values for each stage (mock, dev, prod)
- Stored securely via AWS Secrets Manager
- Show password inputs with "has value" indicator

**Environment Variables:**
- Identified by `ENV_IDENTIFIER = 'env::internal'`
- Stage-specific configuration values
- Stored in project environment settings

### File Locations

Key files for this system:
- `src/components/editor/forms/variable/published-variables.tsx` - Main form component
- `src/components/editor/forms/published-variable-settings-form.tsx` - Variable publishing settings
- `src/components/editor/sidebars/dock/label-publish.tsx` - Publish button in dock
- `src/stores/nodesStore.ts` - Contains `leadsToPlayConfig()` routing logic
- `src/components/editor/nodes/rows/containers/play-button-container.tsx` - Play button UI

### Usage Example

1. **Create a workflow segment:**
   - Add a PlayConfig node
   - Build your workflow logic
   - Connect nodes as needed

2. **Publish input parameters:**
   - Select variables you want to expose
   - Click the publish icon in the dock
   - Add titles and descriptions

3. **Test the segment:**
   - Open the Published Variables form
   - Navigate to your play button's tab
   - Configure variable values
   - Select execution stage
   - Click Run to test

4. **View results:**
   - Execution results appear below the Run button
   - Output variables are displayed formatted

### Implementation Details

**Variable Identification Structure:**
```typescript
type VariableIdentifier = {
    variable: NodeVariable;
    nodeId: string;
    nodeServiceHandle?: string;  // For service synchronization
    nodeServiceVariant?: number;  // Service instance identifier
}
```

**Tab Structure:**
```typescript
type TabItem = {
    key: string;              // Unique identifier
    title: string;            // Display name
    info: string;             // HTML description
    group: {
        playConfigNode?: Node;  // Associated play button node
        variables: VariableIdentifier[];  // Variables in this tab
    };
}
```

### Best Practices

1. **Naming Conventions:**
   - Use clear `published_title` values that describe the parameter's purpose
   - Add `published_description` to document expected values and formats

2. **Variable Organization:**
   - Group related variables in Dict types when possible
   - Use play buttons to create logical workflow segments

3. **Testing Workflows:**
   - Create play buttons at key points for incremental testing
   - Use mock stage for development testing
   - Configure stage-specific secrets appropriately

4. **Synchronization:**
   - Be aware of synchronized variables when using services
   - Changes affect all linked instances