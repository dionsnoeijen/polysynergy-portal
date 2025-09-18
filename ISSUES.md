# Known Issues and Technical Debt

## Priority Issues

### 1. [CRITICAL] Component Architecture Issues

#### Unused Components
- **RunHistoryAccordion** (`/src/components/editor/bottombars/run-history-accordion.tsx`)
  - Fully implemented component but never imported anywhere
  - Contains execution history UI logic
  - Question: Is this supposed to replace something or was it abandoned?

#### Disabled Components  
- **RunHistorySelector** (`/src/components/editor/bottombars/run-history-selector.tsx`)
  - Disabled with `|| true` on line 81
  - Comment says: "Temporarily disabled until retention logic is properly implemented"
  - Contains dropdown for selecting historical runs

### 2. [HIGH] TypeScript and Build Issues

#### Type Safety Problems
- Multiple `any` types throughout codebase
- Missing type definitions for complex objects
- Implicit any in several functions

#### Build Warnings
- ~40+ ESLint warnings/errors during build
- Unused variables across multiple files
- Missing React Hook dependencies

### 3. [MEDIUM] UI/UX Consistency Issues

#### Light Mode Support
- ✅ Fixed: Many components had poor light mode support
- ✅ Fixed: Execution History accordion colors
- ✅ Fixed: Status icons visibility
- Remaining: Check all components systematically

#### Color Theme Consistency  
- Mix of zinc/gray/slate colors in dark mode
- Sky theme not consistently applied in light mode
- Some components still use blue instead of sky

### 4. [LOW] Documentation and Code Quality

#### Missing Documentation
- No clear documentation on RunHistory vs Execution History
- Component relationships unclear
- State management patterns undocumented

## Challenging Issues to Solve

### Async & Performance Problems

#### 1. Flow Execution Blocking Other Calls [PRIORITY 1]
**Problem Description:**
Starting a flow execution blocks other critical operations like WebSocket status checks and logging updates. This is the root cause that makes long-running processes feel worse than they should be.

**Symptoms:**
- WebSocket connection checks timeout during flow start
- Log updates don't appear in real-time
- Status indicators become stale
- Other async operations get queued/delayed
- Makes long-running processes feel unresponsive

**Technical Context:**
- Flow start API call is likely blocking other operations
- No proper task queuing/prioritization system
- Missing concurrency handling
- API calls might be sequential instead of parallel
- Related to Issue #2 - makes long processes feel worse

**Potential Complications:**
- Race conditions if made async
- State management complexity
- Need to maintain execution order for some operations
- Error handling becomes more complex

---

#### 2. Long-Running Processes Need Background Execution
**Problem Description:**
Long-running processes (can take 20+ minutes) have no background execution mechanism. Users shouldn't need to keep the browser tab active/visible for these to complete. This issue is made worse by Issue #1.

**Symptoms:**
- Users need to keep browser tab open
- No way to check on background progress
- Can't start process and come back later
- If Issue #1 is present, feels even more blocking

**Technical Context:**
- No background task management
- Missing proper job/queue system
- No persistence of execution state
- Browser tab dependency
- Would benefit greatly from fixing Issue #1 first

**Why Issue #1 Should Be Fixed First:**
- Fixing flow execution blocking will make long processes feel more responsive
- Even without full background execution, proper async would improve UX
- Users could at least interact with UI while waiting
- Real-time logs would show progress

---

#### 3. Avatar Generation Blocking
**Problem Description:**
Avatar generation is a blocking operation that freezes the interface.

**Symptoms:**
- UI freezes when avatar is being generated
- Cannot interact with other components
- No loading feedback during generation
- Poor user experience

**Technical Context:**
- Avatar generation might be CPU intensive
- Could be doing image processing synchronously
- Missing async image loading patterns
- No progressive loading implementation

---

#### 4. WebSocket Real-time Updates Not Working [ROOT CAUSE FOUND]
**Problem Description:**
WebSocket connection exists and flow executes properly, but real-time updates/events only arrive at the END of execution instead of during execution.

**ROOT CAUSE DISCOVERED:**
The Timeout node uses **synchronous blocking sleep**:
```python
# In ../../nodes/polysynergy_nodes/date_time/timeout.py:28
time.sleep(self.seconds)  # BLOCKS THE ENTIRE PYTHON THREAD!
```

**Test Case - Simple Flow:**
1. Play node
2. Timeout (8 seconds) ← **THIS BLOCKS EVERYTHING**
3. HTTP Response

**What happens:**
1. Timeout node calls `time.sleep(8)` 
2. **Entire Python backend thread is BLOCKED for 8 seconds**
3. No WebSocket messages can be sent during this time
4. No logs, no updates, no communication possible
5. Only when `time.sleep()` finishes, can messages be sent again

**The Fix:**
Replace `time.sleep()` with `asyncio.sleep()` or equivalent async sleep:
```python
# Instead of:
time.sleep(self.seconds)  # Blocks everything

# Should be:
await asyncio.sleep(self.seconds)  # Non-blocking
```

**✅ FIXED AND TESTED:**
- Timeout node updated to use `await asyncio.sleep(self.seconds)`
- Real-time WebSocket updates now work perfectly during execution
- Backend is fully async-compatible
- **This confirms the problem is frontend blocking calls, not backend**

**Key Insights:**
- Backend async execution works perfectly
- Real-time updates flow properly when nodes are async
- **Frontend fire-and-forget pattern is still needed** for long-running flows
- Other nodes may also need async fixes

**Next Steps:**
1. ✅ Backend async works great
2. 🔄 Need backend POST /execution/start/ endpoint for frontend
3. ⏳ Audit other nodes for `time.sleep()` usage

#### 5. WebSocket Connection Reliability Issues  
**Problem Description:**
WebSocket connection is not 100% reliable, especially when network conditions change (e.g., WiFi switching).

**Symptoms:**
- WebSocket appears disconnected while flow is running
- Missing real-time updates (different from Issue #4)
- Connection lost after network change
- Particularly happens when WiFi connection changes

**Technical Context:**
- WebSocket reconnection logic might be flawed
- Missing proper connection state management
- No automatic reconnection on network change
- Possible race condition between connection check and actual state

**Potential Complications:**
- Network change detection is browser-dependent
- WebSocket state might be cached incorrectly
- Reconnection might create duplicate connections
- State synchronization after reconnection

---

#### 6. Chat Storage Detection Not Working [PERFORMANCE SENSITIVE]
**Problem Description:**
The chat component no longer automatically detects when storage is connected to an agent. This breaks the reactive storage warnings and session management UI.

**Symptoms:**
- Storage warnings don't disappear when storage node is connected
- Session management UI doesn't appear when it should  
- Chat thinks there's no storage even when properly connected
- User has to manually refresh or interact to see storage state

**Technical Context:**
- Previous solution caused **massive performance issues** with unnecessary re-renders
- Storage detection relies on connection traversal and node graph analysis
- `traceStorageConfiguration()` function may not be reactive to connection changes
- Possible issue with Zustand store reactivity after fire-and-forget changes

**Root Cause Analysis Needed:**
- Is `traceStorageConfiguration()` being called correctly?
- Are connection changes triggering proper reactivity?
- Has the fire-and-forget implementation affected store subscriptions?
- Are we subscribing to the right Zustand store slices?

**Performance Constraints:**
- ❌ **MUST NOT** cause excessive re-renders like previous solution
- ❌ **MUST NOT** poll or check storage state on every render
- ❌ **MUST NOT** subscribe to entire nodes/connections arrays
- ✅ **MUST** use targeted reactivity only when connections actually change
- ✅ **MUST** debounce/throttle storage checks if needed

**Investigation Priority:**
- Check if storage detection worked before fire-and-force changes
- Identify minimal set of store changes needed for reactivity
- Ensure solution doesn't impact editor performance

---

#### 7. Editor Menu Z-Index Issues [UI/UX]
**Problem Description:**
Editor menus and dropdowns appear behind overlays like delete dialogs, making them unusable when overlays are present.

**Symptoms:**
- Context menus disappear behind modal dialogs
- Dropdown menus not visible when overlays are active
- Delete confirmation dialogs cover essential UI elements
- Navigation becomes impossible when modal states overlap

**Technical Context:**
- CSS z-index hierarchy conflicts between editor menus and overlays
- Modal/overlay components may not properly manage z-index stacking
- Editor menus need higher z-index than overlays
- Possible Tailwind CSS z-index class conflicts

**Implementation Requirements:**
- ✅ **MUST** establish proper z-index hierarchy (menus > overlays > content)
- ✅ **MUST** ensure all editor functionality remains accessible
- ✅ **MUST** maintain visual consistency across light/dark modes
- ❌ **MUST NOT** break existing overlay functionality

---

#### 8. Light Mode Overlay Styling Inconsistencies
**Problem Description:**  
Loading overlays and other overlay components still use gray styling in light mode instead of the sky color theme, breaking visual consistency.

**Symptoms:**
- Loading spinners appear gray instead of sky-themed
- Modal overlays have gray backgrounds instead of sky tints
- Overlay text and borders don't match sky color scheme
- Inconsistent theming breaks user experience continuity

**Technical Context:**
- Components still use `gray-*` Tailwind classes instead of `sky-*` equivalents
- Loading overlays may be using hard-coded gray colors
- Missing light/dark mode conditional styling for overlays
- Possible component library defaults overriding theme colors

**Implementation Requirements:**
- ✅ **MUST** use sky color palette for light mode overlays
- ✅ **MUST** maintain proper contrast for accessibility
- ✅ **MUST** ensure consistent theming across all overlay types
- ✅ **MUST** preserve dark mode functionality

---

#### 9. Light Mode Dock Button Icon Visibility Issues
**Problem Description:**
Button icons in the dock (such as avatar generation buttons) appear white in light mode, making them invisible against light backgrounds.

**Symptoms:**
- Avatar generation button icon not visible in light mode
- Other dock action button icons appear white/invisible
- Poor contrast between white icons and light backgrounds
- Users cannot see available actions in dock panels

**Technical Context:**
- Icons using fixed white color classes instead of theme-aware colors
- Missing light/dark mode conditional icon styling
- Heroicons or custom icons need theme-specific color classes
- Dock components not applying proper icon color themes

**Implementation Requirements:**
- ✅ **MUST** use theme-aware icon colors (dark icons for light mode, light icons for dark mode)
- ✅ **MUST** ensure sufficient contrast for accessibility
- ✅ **MUST** apply consistent icon theming across all dock components
- ✅ **MUST** test visibility in both light and dark modes

**Related Components:**
- `variable-type-avatar.tsx` - Avatar generation button icons
- Other dock variable type components with action buttons

---

### Detailed Analysis Per Issue

#### Issue 1: Flow Execution Blocking [PRIORITY 1]
**Current Implementation Problems:**
- Execute call waits for completion instead of returning immediately
- Frontend blocks on execute response, preventing other API calls
- WebSocket updates (logs) stop updating during execute wait
- Other frontend API calls queue up behind the execute call
- Possible timeout on long-running execute calls
- **Backend continues running fine** - this is purely a frontend blocking issue

**The Real Problem - CODE LOCATIONS:**
- `/src/hooks/editor/useHandlePlay.ts:85-93` - Blocking call:
  ```javascript
  const response = await runMockApi(...); // BLOCKS until complete
  const data = await response.json();
  ```
- `/src/api/runApi.ts:12-21` - The blocking GET request:
  ```javascript
  GET /execution/{versionId}/{nodeId}/ // Waits for full execution
  ```
- Frontend does: `await runMockApi()` and waits for full completion
- Should do: Fire-and-forget with immediate return + monitor via WebSocket
- All other API calls get blocked by this waiting

**Impact:**
- Logs don't update in real-time (WebSocket messages queue up)
- UI appears frozen but backend is actually running
- Other UI operations timeout or queue
- User thinks system is broken when it's actually working

**Proposed Solutions:**

### SOLUTION PLAN:

#### Phase 1: Create New Fire-and-Forget API
1. **New API endpoint: `POST /execution/start`**
   ```javascript
   // Request:
   POST /execution/{versionId}/start/
   {
     "node_id": "string",
     "stage": "mock",
     "sub_stage": "mock",
     "project_id": "string"
   }
   
   // Response (immediate):
   {
     "run_id": "uuid",
     "status": "started",
     "started_at": "timestamp"
   }
   ```

2. **Keep existing endpoint as fallback:**
   - `GET /execution/{versionId}/{nodeId}/` for sync use cases
   - New `POST /execution/{versionId}/start/` for async execution

#### Phase 2: Update Frontend Implementation
1. **New API function in `/src/api/runApi.ts`:**
   ```javascript
   export const startExecutionApi = async (
     projectId: string,
     activeVersionId: string,
     mockNodeId: string,
     stage: string,
     subStage: string
   ) => {
     const idToken = getIdToken();
     const response = await fetch(
       `${config.LOCAL_API_URL}/execution/${activeVersionId}/start/`,
       {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${idToken}`,
         },
         body: JSON.stringify({
           node_id: mockNodeId,
           stage,
           sub_stage: subStage,
           project_id: projectId
         })
       }
     );
     
     if (!response.ok) {
       throw new Error(`Failed to start execution: ${response.statusText}`);
     }
     
     return response.json(); // Returns { run_id, status, started_at }
   };
   ```

2. **Update `/src/hooks/editor/useHandlePlay.ts`:**
   ```javascript
   // Replace lines 85-93:
   // OLD (blocking):
   const response = await runMockApi(...);
   const data = await response.json();
   
   // NEW (fire-and-forget):
   const executionResult = await startExecutionApi(
     activeProjectId,
     activeVersionId,
     nodeId,
     'mock',
     subStage
   );
   
   console.log('🚀 EXECUTION STARTED:', executionResult.run_id);
   // Remove the blocking getNodeExecutionDetails call
   // WebSocket will handle all updates from here
   ```

#### Phase 3: WebSocket Integration
1. **Enhance WebSocket listener to handle execution updates**
2. **Remove blocking result fetching**
3. **Update UI state based on WebSocket messages only**

#### Phase 4: Error Handling & Fallback
1. **Add timeout for start request (should be fast)**
2. **Fallback to old blocking method if new API unavailable**
3. **Proper error messages for execution start failures**

### IMPLEMENTATION ORDER:
1. ✅ Document the problem
2. 🔄 Create new `startExecutionApi` function
3. ⏳ Update `useHandlePlay` to use new pattern  
4. ⏳ Test with real WebSocket updates
5. ⏳ Add error handling and fallback

---

#### Issue 2: Long-Running Processes Background
**Current Implementation Problems:**
- No true background execution (depends on browser tab)
- If Issue #1 exists, makes it feel completely frozen
- No way to close browser and come back later

**Impact:**
- Users wait 20+ minutes watching screen
- Can't do other work while waiting
- Browser tab must stay open

**Proposed Solutions:**
1. Fix Issue #1 first (will make this feel much better)
2. Implement server-side job queue
3. Add progress persistence
4. Allow checking status after browser close/reopen

---

#### Issue 3: Avatar Generation
**Current Implementation Problems:**
- [TO BE INVESTIGATED]
- 
- 

**Impact:**
- Poor user experience
- UI appears frozen
- No feedback on operation progress

**Proposed Solutions:**
1. Move to async avatar generation
2. Use lazy loading with placeholder
3. Implement progressive image loading
4. Consider server-side generation with URL return

---

#### Issue 4: WebSocket Reliability
**Current Implementation Problems:**
- [TO BE INVESTIGATED]
- 
- 

**Impact:**
- Lost real-time updates
- Inconsistent application state
- User confusion about execution status
- Need to refresh to restore functionality

**Proposed Solutions:**
1. Implement robust reconnection logic
2. Add network change event listeners
3. Implement heartbeat/ping-pong mechanism
4. Queue messages during disconnection
5. Add connection status indicator to UI
6. Force reconnect on network change event

---

## Technical Debt Log

### Components
- [ ] Remove or implement RunHistoryAccordion
- [ ] Enable RunHistorySelector when retention logic is ready
- [ ] Consolidate execution history components

### Type Safety
- [ ] Replace all `any` types with proper TypeScript types
- [ ] Add missing type definitions
- [ ] Fix TypeScript strict mode issues

### Build Health
- [ ] Fix all ESLint errors
- [ ] Remove unused imports and variables
- [ ] Fix React Hook dependency warnings

### UI Consistency
- [ ] Audit all components for light/dark mode support
- [ ] Standardize color palette usage
- [ ] Create design system documentation

---

*Last Updated: 2025-09-17*