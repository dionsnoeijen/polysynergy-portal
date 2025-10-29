# WebSocket Handler Refactor Plan
**Datum**: 29 oktober 2025
**Status**: Plan goedgekeurd, implementatie pending

---

## 🎯 Samenvatting

Het WebSocket event handling systeem refactoren voor **robuustheid en maintainability** zonder de fundamentele architectuur te veranderen.

### Kernprincipes die BEHOUDEN blijven:
- ✅ **DOM manipulatie** voor instant visual feedback (glow animaties)
- ✅ **React/mockStore** voor data persistence (order badges, output)
- ✅ **Hybride systeem** waar beide parallel werken

### Wat WEL verandert:
- ❌ Monolithische 1100+ regels handler → Gemodulariseerde handlers
- ❌ Module-level state → Centralized tracking class
- ❌ Geen error handling → Error isolation per handler

---

## 📊 Huidige Situatie - Problemen

### 1. **Monolithische Handler**
**Locatie**: `src/hooks/editor/nodes/useSmartWebSocketListener.ts`
**Grootte**: 1129 regels in één async functie

**Structuur**:
```typescript
globalMessageHandler = async (event: MessageEvent) => {
  // Parsing (10 regels)
  // Chat events (100+ regels)
  // Streaming content (150+ regels)
  // Tool execution (100+ regels)
  // Node execution (300+ regels)
  // Group logic (200+ regels)
  // Run lifecycle (200+ regels)
  // ... totaal 1100+ regels
};
```

**Probleem**:
- Error ERGENS → ALLES crasht
- User moet browser refreshen
- Execution events worden niet meer verwerkt
- Portal blijft hangen in "executing" state

### 2. **Module-Level State**
```typescript
const processedEvents = new Set<string>();
const completedRunIds = new Set<string>();
const toolExecutionTracker = new Map<...>();
const toolVisualizationTracker = new Map<...>();
const groupStatesByRun = new Map<...>();
const nodeExecutionStateByRun = new Map<...>();
const pendingAnimationsByRun = new Map<...>();
```

**Problemen**:
- Niet testbaar (geen isolatie)
- Geen React DevTools visibility
- Manual memory management (memory leaks mogelijk)
- State shared tussen alle hook instances

### 3. **Geen Error Isolation**
```typescript
// Huidige code
try {
  message = JSON.parse(data);
} catch {
  return;
}

// Daarna: NO TRY-CATCH meer
// DOM updates
// Store updates
// API calls
// ← Als hier iets faalt → HELE handler crasht
```

**Gevolg**:
- Lambda ResourceConflictException → Handler crasht
- Syntax error in chat HTML → Handler crasht
- Null reference in group logic → Handler crasht
- User ziet: Portal hangt, geen events meer

---

## 🏗️ Nieuwe Architectuur

### **High-Level Flow**

```
┌─────────────────────┐
│  WebSocket Message  │
└──────────┬──────────┘
           ↓
    ┌──────────────┐
    │ Parse & Validate │
    └──────┬───────┘
           ↓
    ┌──────────────────┐
    │  Event Router    │ ← Routes naar juiste handlers
    └──────┬───────────┘
           ↓
    [Handler Pipeline - Parallel Execution]
           ├─→ DOMVisualHandler        ← DOM classList updates
           ├─→ MockStoreHandler        ← mockStore updates (React)
           ├─→ RunLifecycleHandler     ← run_start, run_end
           ├─→ ToolVisualizationHandler← Tool glow logic
           ├─→ ChatStreamHandler       ← Chat content streaming
           ├─→ InteractionHandler      ← OAuth, pauses
           └─→ GroupExecutionHandler   ← Group node logic

    Promise.allSettled() ← Error in één handler = geen probleem
           ↓
    [Visual Updates Complete]
```

### **Error Isolation**
```
Scenario: Error in DOMVisualHandler
  ❌ DOM glow update faalt
  ✅ Order badge verschijnt nog (MockStoreHandler werkt)
  ✅ Chat updates werken (ChatStreamHandler werkt)
  ✅ Run tracking werkt (RunLifecycleHandler werkt)
  ✅ Portal blijft functioneel (geen crash)
```

---

## 📁 Nieuwe File Structuur

```
src/hooks/editor/websocket/
├── useSmartWebSocketListener.ts    # Main hook (SIMPLIFIED - ~50 regels)
│
├── core/
│   ├── BaseHandler.ts              # Handler interface definition
│   ├── EventRouter.ts              # Routes messages to handlers
│   └── HandlerContext.ts           # Shared context type
│
├── handlers/
│   ├── DOMVisualHandler.ts         # DOM classList updates (~100 regels)
│   ├── MockStoreHandler.ts         # mockStore updates (~80 regels)
│   ├── RunLifecycleHandler.ts      # run_start, run_end (~120 regels)
│   ├── ToolVisualizationHandler.ts # Tool glow logic (~100 regels)
│   ├── ChatStreamHandler.ts        # RunContent, TeamRunContent (~150 regels)
│   ├── InteractionHandler.ts       # OAuth, AgentPaused (~80 regels)
│   └── GroupExecutionHandler.ts    # Group node logic (~120 regels)
│
└── state/
    └── ExecutionTracking.ts        # Centralized tracking state (~150 regels)
```

**Totaal**: ~950 regels verdeeld over 11 bestanden (was 1129 in 1 bestand)

---

## 🔧 Implementatie Details

### **1. BaseHandler Interface**

```typescript
// core/BaseHandler.ts
export interface EventHandler {
  name: string;
  canHandle(message: ExecutionMessage): boolean;
  handle(message: ExecutionMessage, context: HandlerContext): Promise<void>;
}
```

**Design Principles**:
- Elke handler heeft een duidelijke naam (voor logging)
- `canHandle()` - Filter welke events deze handler verwerkt
- `handle()` - Verwerk het event, throw GEEN errors (log only)

### **2. HandlerContext**

```typescript
// core/HandlerContext.ts
export interface HandlerContext {
  stores: {
    editor: ReturnType<typeof useEditorStore.getState>;
    runs: ReturnType<typeof useRunsStore.getState>;
    mock: ReturnType<typeof useMockStore.getState>;
    nodes: ReturnType<typeof useNodesStore.getState>;
    chatView: ReturnType<typeof useChatViewStore.getState>;
  };
  tracking: ExecutionTracking;
}
```

**Waarom**:
- Alle handlers hebben toegang tot dezelfde stores
- Shared tracking state (processedEvents, completedRunIds, etc.)
- Makkelijk om te mocken voor tests

### **3. EventRouter**

```typescript
// core/EventRouter.ts
export class EventRouter {
  private handlers: EventHandler[] = [];

  register(handler: EventHandler) {
    this.handlers.push(handler);
  }

  async route(message: ExecutionMessage, context: HandlerContext) {
    // Find applicable handlers
    const applicable = this.handlers.filter(h => h.canHandle(message));

    if (applicable.length === 0) {
      console.warn('[EventRouter] No handler for:', message.event);
      return;
    }

    // Execute in parallel met error isolation
    const results = await Promise.allSettled(
      applicable.map(h => h.handle(message, context))
    );

    // Log failures maar crash NIET
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(
          `❌ [${applicable[i].name}] Failed:`,
          result.reason
        );
      }
    });
  }
}
```

**Voordelen**:
- `Promise.allSettled()` → Alle handlers krijgen kans om te draaien
- Error in één handler blokkeert anderen niet
- Clear logging welke handler faalde

### **4. ExecutionTracking (Centralized State)**

```typescript
// state/ExecutionTracking.ts
export class ExecutionTracking {
  // Event deduplication
  private processedEvents = new Set<string>();

  // Run completion tracking
  private completedRunIds = new Set<string>();

  // Animation scheduling
  private animationTimeouts = new Map<string, NodeJS.Timeout>();

  // Tool execution tracking
  private toolExecutions = new Map<string, {
    startTime: number;
    startEvent: unknown;
  }>();

  // Tool visualization (minimum display time)
  private toolVisualizations = new Map<string, {
    timeoutId: NodeJS.Timeout | null;
    displayStartTime: number;
  }>();

  // Group execution state (per run)
  private groupStates = new Map<string, Map<string, {
    count: number;
    remaining: number;
  }>>();

  // Node execution state (per run)
  private nodeStates = new Map<string, Map<string, {
    started: boolean;
    ended: boolean;
    status?: string;
  }>>();

  // Methods...
  hasProcessed(eventId: string): boolean { ... }
  markProcessed(eventId: string): void { ... }
  isRunCompleted(runId: string): boolean { ... }
  markRunCompleted(runId: string): void { ... }
  scheduleAnimation(nodeId: string, fn: () => void, delay: number): void { ... }
  clearRun(runId: string): void { ... }
  clear(): void { ... }
}
```

**Voordelen**:
- Single source of truth voor tracking
- Memory management in één plek
- Testbaar (geen module-level state)
- Auto-cleanup via `clear()` en `clearRun()`

---

## 📝 Handler Details

### **DOMVisualHandler** (~100 regels)

**Verantwoordelijkheid**:
- DOM classList updates voor visuele feedback
- Instant glow animaties tijdens execution

**Event Types**:
- `start_node` → Add `executing` class
- `end_node` → Remove `executing`, add `executed-{status}` class

**Code Voorbeeld**:
```typescript
export class DOMVisualHandler implements EventHandler {
  name = 'DOMVisualHandler';

  canHandle(msg: ExecutionMessage): boolean {
    return ['start_node', 'end_node'].includes(msg.event);
  }

  async handle(msg: ExecutionMessage, ctx: HandlerContext): Promise<void> {
    const { node_id, run_id, event, status } = msg;

    // Skip visual updates voor backgrounded runs
    if (ctx.stores.runs.backgroundedRunIds.has(run_id!)) {
      return;
    }

    const el = document.querySelector(`[data-node-id="${node_id}"]`);
    if (!el) return;

    try {
      if (event === 'start_node') {
        el.classList.add('executing');
        el.classList.remove('executed-success', 'executed-error', 'executed-killed');
      }
      else if (event === 'end_node') {
        // Schedule met minimum display time
        ctx.tracking.scheduleAnimation(node_id!, () => {
          // Double-check run niet completed
          if (ctx.tracking.isRunCompleted(run_id!)) return;

          el.classList.remove('executing');
          if (status) {
            el.classList.add(`executed-${status}`);
          }
        }, 500);
      }
    } catch (error) {
      console.error(`[${this.name}] Failed for ${node_id}:`, error);
      // Don't rethrow - andere handlers blijven werken
    }
  }
}
```

### **MockStoreHandler** (~80 regels)

**Verantwoordelijkheid**:
- Update mockStore met execution data
- Triggert React re-renders voor ExecutionOrder badge component

**Event Types**:
- `start_node` → Create mockNode met status 'executing'
- `end_node` → Update mockNode met final status

**Code Voorbeeld**:
```typescript
export class MockStoreHandler implements EventHandler {
  name = 'MockStoreHandler';

  canHandle(msg: ExecutionMessage): boolean {
    return ['start_node', 'end_node'].includes(msg.event);
  }

  async handle(msg: ExecutionMessage, ctx: HandlerContext): Promise<void> {
    const { node_id, run_id, event, status, order } = msg;

    try {
      const nodeFlowNode = ctx.stores.nodes.getNode(node_id!);
      const type = nodeFlowNode?.path.split(".").pop();

      const mockNodeData: MockNode = {
        id: `${node_id}-${order || 0}`,
        handle: nodeFlowNode?.handle || 'Unknown',
        runId: run_id!,
        order: order || 0,
        killed: status === 'killed',
        type,
        started: event === 'start_node',
        variables: {},
        status: event === 'start_node' ? 'executing' : status,
      };

      // React state update → ExecutionOrder component re-renders
      ctx.stores.mock.addOrUpdateMockNode(mockNodeData);

    } catch (error) {
      console.error(`[${this.name}] Failed for ${node_id}:`, error);
    }
  }
}
```

### **RunLifecycleHandler** (~120 regels)

**Verantwoordelijkheid**:
- Handle run_start: Clear state, start log polling
- Handle run_end: Clear visual classes, unlock editor, fetch results

**Event Types**:
- `run_start`
- `run_end`
- `resume_start`
- `resume_end`

### **ToolVisualizationHandler** (~100 regels)

**Verantwoordelijkheid**:
- Tool glow animaties (gele border)
- Minimum display time (2 seconden)

**Event Types**:
- `start_tool` → Add `executing-tool` class
- `end_tool` → Remove class (after minimum display time)

### **ChatStreamHandler** (~150 regels)

**Verantwoordelijkheid**:
- Streaming chat content
- Team member responses
- Reasoning content

**Event Types**:
- `RunContent`
- `TeamRunContent`
- `ReasoningContent`
- `RunReasoningContent`
- `TeamRunReasoningContent`

### **InteractionHandler** (~80 regels)

**Verantwoordelijkheid**:
- OAuth authorization popups
- Agent paused events
- Chat HTML content

**Event Types**:
- `interaction_event` (OAuth)
- `AgentPaused`
- `ChatHTML`

### **GroupExecutionHandler** (~120 regels)

**Verantwoordelijkheid**:
- Group node execution tracking
- Bubble status naar parent group
- Nested groups support

**Event Types**:
- `start_node` (voor nodes in groups)
- `end_node` (voor nodes in groups)

---

## 🎯 User Experience

### **Visual States Timeline**

```
User clicks Play →

T0: run_start
    ├─ DOMVisualHandler: Geen change
    └─ MockStoreHandler: Geen change

T1: start_node (node-1, order: 0)
    ├─ DOMVisualHandler: 🔵 Blauwe glow (classList.add('executing'))
    └─ MockStoreHandler: ① Badge verschijnt (ExecutionOrder re-renders)

T2: start_tool (node-1)
    ├─ ToolVisualizationHandler: 🟡 Gele border
    └─ DOMVisualHandler: 🔵 Blijft

T3: end_tool (node-1)
    └─ ToolVisualizationHandler: 🟡 Verdwijnt (na 2s minimum)

T4: end_node (node-1, status: "success")
    ├─ DOMVisualHandler: 🔵 → 🟢 Groene border (na 500ms)
    └─ MockStoreHandler: ① Badge blijft, status updated

T5: start_node (node-2, order: 1)
    ├─ DOMVisualHandler: 🔵 Node-2 glow
    └─ MockStoreHandler: ② Badge voor node-2

T6: end_node (node-2, status: "success")
    ├─ DOMVisualHandler: 🔵 → 🟢
    └─ MockStoreHandler: ②① Beide badges blijven

T7: run_end
    ├─ DOMVisualHandler: Alle glows/borders weg (DOM cleared)
    └─ MockStoreHandler: ②① Badges BLIJVEN (React state intact)
```

### **Na Execution**

**User ziet**:
- ❌ Geen gekleurde borders (DOM cleaned by run_end)
- ✅ Execution order badges blijven staan (mockStore intact)
- ✅ NodeOutput panel toont resultaten (mockStore intact)
- ✅ Runs panel toont completed run (runsStore intact)

---

## ✅ Voordelen van Nieuwe Architectuur

### **1. Error Isolation**
```
Scenario: Lambda ResourceConflictException tijdens execution

Voor refactor:
  ❌ WebSocket handler crasht volledig
  ❌ Alle toekomstige events worden genegeerd
  ❌ Portal blijft hangen
  ❌ User moet browser refreshen

Na refactor:
  ✅ Error alleen in RunLifecycleHandler (API call faalt)
  ✅ DOMVisualHandler werkt gewoon → Glows verschijnen
  ✅ MockStoreHandler werkt gewoon → Badges verschijnen
  ✅ ChatStreamHandler werkt gewoon → Chat updates
  ✅ Portal blijft functioneel
  ✅ User kan doorwerken
```

### **2. Testbaarheid**

**Voor**:
```typescript
// Niet testbaar - 1100 regels in één functie
test('WebSocket handler', () => {
  // Hoe test je dit???
});
```

**Na**:
```typescript
test('DOMVisualHandler adds executing class', async () => {
  const handler = new DOMVisualHandler();
  const mockEl = { classList: { add: jest.fn() } };
  document.querySelector = jest.fn(() => mockEl);

  await handler.handle(
    { event: 'start_node', node_id: 'node-1', run_id: 'run-1' },
    mockContext
  );

  expect(mockEl.classList.add).toHaveBeenCalledWith('executing');
});

test('MockStoreHandler creates mockNode', async () => {
  const handler = new MockStoreHandler();
  const mockStore = { addOrUpdateMockNode: jest.fn() };

  await handler.handle(
    { event: 'start_node', node_id: 'node-1', order: 0, run_id: 'run-1' },
    { stores: { mock: mockStore, ... }, tracking: mockTracking }
  );

  expect(mockStore.addOrUpdateMockNode).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'node-1-0', status: 'executing' })
  );
});
```

### **3. Maintainability**

**Voor**:
- 1 bestand, 1129 regels
- Moeilijk om iets te vinden
- Hoge cognitive load

**Na**:
- 11 bestanden, ~100 regels per handler
- Clear separation of concerns
- Makkelijk om nieuwe handler toe te voegen

### **4. Debuggability**

**Console Output**:
```
[EventRouter] Routing event: start_node
[DOMVisualHandler] Updated node-1 with executing class
[MockStoreHandler] Added mockNode node-1 with order 0
[GroupExecutionHandler] Group group-1 started execution (3 nodes)

[EventRouter] Routing event: end_tool
❌ [ToolVisualizationHandler] Failed: TypeError: Cannot read property 'timeoutId' of undefined
  at ToolVisualizationHandler.handle (ToolVisualizationHandler.ts:45)
[DOMVisualHandler] Node-1 completed with success

[EventRouter] Routing event: run_end
[RunLifecycleHandler] Run run-123 completed, clearing visual states
```

**Voordelen**:
- Zie exact welke handler faalde
- Stack trace wijst naar kleine handler functie
- Andere handlers blijven werken

### **5. Performance**

**Parallel Execution**:
```typescript
// Handlers draaien parallel, niet sequentieel
await Promise.allSettled([
  domHandler.handle(message),      // 5ms
  mockStoreHandler.handle(message), // 3ms
  chatHandler.handle(message)       // 2ms
]);
// Totaal: max(5,3,2) = 5ms

// vs sequentieel: 5+3+2 = 10ms
```

---

## 📋 Implementatie Plan

### **Fase 1: Foundation** (3-4 uur)

**Taken**:
1. Create `src/hooks/editor/websocket/core/` directory
2. Implement `BaseHandler.ts` interface
3. Implement `HandlerContext.ts` types
4. Implement `EventRouter.ts` class
5. Create `src/hooks/editor/websocket/state/` directory
6. Implement `ExecutionTracking.ts` class
7. Write unit tests voor router & tracking

**Deliverables**:
- ✅ Core infrastructure klaar
- ✅ Tracking state centralized
- ✅ Tests passing

### **Fase 2: Handlers** (6-8 uur)

**Taken per handler**:
1. Create handler file
2. Extract logic van oude handler
3. Implement `canHandle()` en `handle()`
4. Add error handling (try-catch, no rethrow)
5. Write unit tests

**Volgorde**:
1. `DOMVisualHandler.ts` (simpelst, geen dependencies)
2. `MockStoreHandler.ts` (simpel, parallel aan DOM)
3. `RunLifecycleHandler.ts` (complexer, API calls)
4. `ToolVisualizationHandler.ts` (medium, tracking state)
5. `ChatStreamHandler.ts` (complex, veel event types)
6. `InteractionHandler.ts` (simpel, weinig logic)
7. `GroupExecutionHandler.ts` (complex, nested groups)

**Deliverables**:
- ✅ 7 handlers geïmplementeerd
- ✅ Unit tests per handler
- ✅ Code coverage >80%

### **Fase 3: Integration** (3-4 uur)

**Taken**:
1. Refactor `useSmartWebSocketListener.ts`
2. Initialize EventRouter met alle handlers
3. Replace monolithische handler met router.route()
4. Remove oude code (backup eerst!)
5. Update cleanup logic (tracking.clear())
6. Integration tests

**Deliverables**:
- ✅ Main hook gebruikt nieuwe router
- ✅ Oude code verwijderd
- ✅ Integration tests passing

### **Fase 4: Validation** (2-3 uur)

**Testen**:
1. ✅ run_start event → log polling start
2. ✅ start_node → blauwe glow + order badge
3. ✅ start_tool → gele border
4. ✅ end_tool → gele border verdwijnt
5. ✅ end_node → groene border + status update
6. ✅ run_end → alle borders weg, badges blijven
7. ✅ Error scenario: Force error in één handler, check anderen blijven werken
8. ✅ Memory leak test: Run 50+ executions, check tracking.size

**Deliverables**:
- ✅ Alle event types werken
- ✅ Error isolation verified
- ✅ No memory leaks
- ✅ No regressions

### **Fase 5: Deployment** (1 uur)

**Taken**:
1. Build production bundle
2. Deploy naar production
3. Monitor Sentry voor errors
4. Monitor browser console logs
5. User feedback

**Deliverables**:
- ✅ Production deployment
- ✅ No critical errors in Sentry
- ✅ User confirms portal stable

---

## ⏱️ Timeline

**Week 1**:
- Dag 1-2: Fase 1 Foundation (4 uur)
- Dag 3-5: Fase 2 Handlers deel 1 (DOMVisual, MockStore, RunLifecycle) (4 uur)

**Week 2**:
- Dag 1-2: Fase 2 Handlers deel 2 (Tool, Chat, Interaction, Group) (4 uur)
- Dag 3-4: Fase 3 Integration (4 uur)

**Week 3**:
- Dag 1-2: Fase 4 Validation (3 uur)
- Dag 3: Fase 5 Deployment (1 uur)

**Totaal**: 15-20 uur werk over 3 weken

---

## 🎯 Success Criteria

1. ✅ **No Complete Handler Crashes**
   - Error in één handler → Portal blijft werken
   - User moet nooit meer browser refreshen

2. ✅ **Error Isolation Verified**
   - Test: Force error in DOMVisualHandler
   - Expect: Order badges verschijnen nog steeds
   - Expect: Chat updates werken nog steeds

3. ✅ **No Performance Regression**
   - DOM updates blijven instant (<10ms)
   - React updates blijven smooth (<50ms)
   - Total event processing <100ms

4. ✅ **Code Coverage >80%**
   - Unit tests voor alle handlers
   - Integration tests voor router
   - Edge case tests (errors, missing elements)

5. ✅ **No Memory Leaks**
   - Run 100 executions
   - Check tracking state cleanup
   - Check no growing Maps/Sets

6. ✅ **User Acceptance**
   - No reported hangs
   - All visual feedback works
   - Order badges appear correctly

---

## ⚠️ Wat NIET Verandert

### **Architectuur Behouden**:
1. ❌ DOM manipulatie methode (blijft `querySelector` + `classList`)
2. ❌ React state systeem (blijft mockStore)
3. ❌ Timing logic (500ms delays voor animations)
4. ❌ CSS animation classes (blijft `executing`, `executed-success`)
5. ❌ WebSocket connection (blijft GlobalWebSocketManager singleton)

### **Waarom Behouden**:
- DOM updates zijn instant (geen React re-render cycle)
- mockStore geeft persistence na run_end
- Proven system, werkt goed als het niet crasht
- Refactor focus: **Robuustheid**, niet architectuur

---

## 🚨 Risico's en Mitigatie

### **Risico 1: Regression Bugs**
**Kans**: Medium
**Impact**: Hoog

**Mitigatie**:
- ✅ Comprehensive test coverage (>80%)
- ✅ Manual testing alle event types
- ✅ Keep backup van oude code
- ✅ Feature flag mogelijk (nieuwe vs oude handler)

### **Risico 2: Performance Degradatie**
**Kans**: Laag
**Impact**: Medium

**Mitigatie**:
- ✅ Parallel execution (Promise.allSettled)
- ✅ Performance tests voor/na
- ✅ Browser profiling

### **Risico 3: Incomplete Handler Logic**
**Kans**: Medium
**Impact**: Medium

**Mitigatie**:
- ✅ Systematic extraction van oude code
- ✅ Review elke handler tegen oude code
- ✅ Integration tests

### **Risico 4: Memory Leaks**
**Kans**: Laag
**Impact**: Hoog

**Mitigatie**:
- ✅ Centralized cleanup in ExecutionTracking
- ✅ Memory profiling tests
- ✅ Automatic cleanup limits (max 50 runs)

---

## 📚 Referenties

### **Relevante Files**:
- `src/hooks/editor/nodes/useSmartWebSocketListener.ts` (1129 regels - TO REFACTOR)
- `src/utils/GlobalWebSocketManager.ts` (WebSocket singleton)
- `src/utils/WebSocketManager.ts` (Base WebSocket class)
- `src/stores/mockStore.ts` (React state voor execution data)
- `src/stores/runsStore.ts` (Run tracking state)
- `src/stores/editorStore.ts` (Editor lock/unlock)
- `src/components/editor/nodes/execution-order.tsx` (Order badge component)

### **Event Types**:
```typescript
type ExecutionMessage = {
  event:
    | 'run_start'
    | 'start_node'
    | 'end_node'
    | 'run_end'
    | 'start_tool'
    | 'end_tool'
    | 'RunContent'
    | 'TeamRunContent'
    | 'TeamToolCallCompleted'
    | 'resume_start'
    | 'resume_end'
    | 'AgentPaused'
    | 'ChatHTML'
    | 'ReasoningContent'
    | 'RunReasoningContent'
    | 'TeamRunReasoningContent';
  node_id?: string;
  run_id?: string;
  status?: 'success' | 'killed' | 'error';
  order?: number;
  content?: string;
  // ... meer fields
};
```

---

## 📝 Notes

### **Lambda ResourceConflictException Issue**
**Datum**: 27 okt 2025
**Issue**: Backend Lambda update conflict tijdens node execution
**Gevolg**: Handler crashte, events niet meer verwerkt
**Sentry**: `python-fastapi` project, production environment

**Quote**:
> "Error updating function image for node_setup_..._mock: An error occurred (ResourceConflictException) when calling the UpdateFunctionCode operation: The operation cannot be performed at this time. An update is in progress"

**Conclusie**: Dit is een backend issue, maar toont aan dat de handler moet kunnen omgaan met externe errors zonder te crashen.

### **User Frustration**
**Quote gebruiker**:
> "Goed, we hebben nog altijd, ondanks enorme inspanning, een giga probleem met de api online. De events van de flow worden soms niet verwerkt. Als ik de applicatie refresh, dan werkt het weer. Dat vertelt mij dat er iets misgaat in de portal zelf, niet met het zenden van de events."

**Impact**:
- Showstopper voor productie gebruik
- Requires browser refresh (bad UX)
- Intermittent (moeilijk te debuggen)

### **Hybrid Architecture Rationale**
**Waarom DOM + React**:
1. **DOM** = Instant visual feedback (no React cycle)
2. **React** = Data persistence (order badges, output)
3. **Parallel** = Best of both worlds

**User ziet**:
- Snelle feedback tijdens execution (DOM glows)
- Blijvende info na execution (React badges)

---

**Document End**
**Volgende Stap**: Start Fase 1 - Foundation implementatie
