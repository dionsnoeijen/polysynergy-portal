# Services & Published Variables - Verbeterpunten en Plan van Aanpak

## Status Update
- ✅ **Service Creation Cancel Bug** - OPGELOST
- 🔄 **Handle Resolution Research** - COMPLEET
- ⏳ **Implementation** - IN VOORBEREIDING

---

## 🔴 KRITIEKE ARCHITECTUUR BESLISSING: Handle Management

### **Het Handle Dilemma**

**Huidige situatie:**
- Services kopiëren refresht automatisch alle handles voor uniciteit (`uniqueNamesGenerator`)
- Dit breekt template references: `{{ super_handle.value }}` werkt niet meer na service kopiëring
- Catch-22 tussen uniciteit en werkende referenties

**Gekozen oplossing: Backwards Flow Handle Resolution**
- Stop met handle refreshing bij service kopiëring
- Implementeer backwards flow traversal in template engine
- Template `{{ super_handle.value }}` zoekt backwards in flow naar eerste node met die handle
- Handles worden "flow-scoped labels" in plaats van globaal unieke identifiers

---

## 🔬 DEEP DIVE: Handle Resolution System

### **Template Resolution Architecture**

**Core Files:**
- `/node_runner/polysynergy_node_runner/execution_context/replace_placeholders.py`
- `/node_runner/polysynergy_node_runner/execution_context/mixins/placeholder_replacement_mixin.py`

**Hoe Template Resolution Werkt:**
```python
def replace_placeholders(data, values: dict = None, state=None):
    # Uses Jinja2 templating met {{ handle.value }} syntax
    # ExecutionState.nodes_by_handle mapping voor fast handle lookup
    context = dict(values or {})

    if state:
        for handle, node in state.nodes_by_handle.items():
            context[handle] = node.to_dict()  # Handle -> Node mapping
```

**Key Discovery:** Template resolution gebruikt `ExecutionState.nodes_by_handle` dict voor handle->node mapping

### **Graph Traversal Capabilities**

**Core Files:**
- `/node_runner/polysynergy_node_runner/execution_context/utils/traversal.py`
- `/node_runner/polysynergy_node_runner/setup_context/connection_manager.py`

**De find_nodes_until Functie:**
```python
def find_nodes_until(
    start_node: "ExecutableNode",
    match_end_node_fn: Callable[["ExecutableNode"], bool],
    get_node_by_id: Callable[[str], "ExecutableNode"],
    skip_node_fn: Callable[["ExecutableNode"], bool] = None,
    post_process_fn: Callable[["ExecutableNode"], None] = None
):
    # Forward traversal: Uses node.get_out_connections()
    # CAN BE ADAPTED for backward traversal met get_in_connections()!
```

**Portal Graph Traversal:**
```typescript
// connectionsStore.ts - ALREADY HAS backward traversal!
findInConnectionsByNodeId: (nodeId: string) => Connection[]     // BACKWARD
findOutConnectionsByNodeId: (nodeId: string) => Connection[]    // FORWARD

// nodesStore.ts - BIDIRECTIONAL traversal example
leadsToPlayConfig: (startNodeId: string): Node | undefined => {
    // Uses BOTH input and output connections!
    const inputConns = findInConnectionsByNodeId(nodeId);
    const outputConns = findOutConnectionsByNodeId(nodeId);
}
```

### **Service Kopiëring Process**

**Problematische Code:**
```typescript
// placeService.ts:59 - HIER worden handles ge-refreshed!
const copy: Node = {
    ...n,
    handle: uniqueNamesGenerator({dictionaries: [adjectives, animals, colors]}) // PROBLEEM!
}
```

**Service Variable Sync (Werkt al wel):**
```typescript
// Published variables worden WEL gesynchroniseerd tussen service instances
const existing = ctx.getNodesByServiceHandleAndVariant(handle, variant);
if (existing.length === 0) return n;

const ref = existing[0];
const vars = n.variables.map((v) =>
    v.published ? {
        ...v,
        value: ref.variables.find((rv) => rv.handle === v.handle)?.value,
    } : v
);
```

---

## 🎯 IMPLEMENTATIE PLAN: Backwards Flow Handle Resolution

### **Fase 1: Connection Manager Update**
**File:** `/node_runner/setup_context/connection_manager.py`
- Voeg `get_in_connections(node_id)` method toe
- Tegenovergestelde van bestaande `get_out_connections`
- Gebruik input connections voor backwards traversal

### **Fase 2: Backwards Traversal Utility**
**File:** `/node_runner/execution_context/utils/traversal.py`
- Kopieer bestaande `find_nodes_until` functie
- Maak `find_nodes_until_backwards` variant
- Switch `get_out_connections()` naar `get_in_connections()`
- Traverseert upstream tot node met gewenste handle gevonden

### **Fase 3: Template Resolution Enhancement**
**Files:**
- `/node_runner/execution_context/replace_placeholders.py`
- `/node_runner/execution_context/mixins/placeholder_replacement_mixin.py`

**Fallback Logic:**
1. Zoek handle in lokale context (huidige gedrag)
2. Als niet gevonden: gebruik backwards traversal
3. Cache resultaten voor performance
4. Fail gracefully als niets gevonden

### **Fase 4: Handle Preservation**
**File:** `/portal/src/utils/placeService.ts`
- Voeg optie toe om handles te behouden
- Selective refresh: alleen bij echte conflicts
- Maintain backward compatibility

### **Fase 5: Testing & Validation**
- Test `{{ handle.value }}` references na service kopiëring
- Verify geen infinite loops in circular flows
- Performance testing met complexe flows
- End-to-end validation

---

## 🚀 ANDERE VERBETERPUNTEN

### 1. **✅ BUG OPGELOST: Service Creation Cancel Issue**
**Status:** FIXED in commit b030baa
- Service form muteerde direct node.service bij form load
- Fix: Lokale tempService state, geen directe node mutatie meer

### 2. **Published Variables Tab Routing** 🟡 MEDIUM
**Probleem:** Alle published variables in Configuration tab, play button tabs niet aangemaakt
**Oplossing:** Implementeer `leadsToPlayConfig()` routing in published-variables.tsx

### 3. **Service Variable Synchronisatie** 🟡 MEDIUM
**Probleem:** Alleen published variables synchroniseren tussen instances
**Uitbreiding:** Sync alle service variables indien gewenst

### 4. **OAuth Integration** 🟢 LAAG
**Probleem:** OAuth UI bestaat maar integratie incompleet
**Oplossing:** Integreer OAuth in published variables form

### 5. **Performance Optimalisaties** 🟢 LAAG
- Memoize syncMap calculation
- Debounce synchronized variable updates
- Optimize voor grote service instances

---

## 🎯 IMPLEMENTATIE VOLGORDE

### **Prioriteit 1: Handle Resolution (Deze Sprint)**
1. ✅ Research & Design - COMPLEET
2. 🔄 ConnectionManager backwards support
3. 🔄 Backwards traversal utility
4. 🔄 Template resolution enhancement
5. 🔄 Handle preservation in placeService
6. 🔄 End-to-end testing

### **Prioriteit 2: Published Variables Improvements**
7. Play button tab routing fix
8. Service variable sync improvements

### **Prioriteit 3: Polish & Performance**
9. OAuth integration completion
10. Performance optimizations
11. UX improvements

---

## 🧠 TECHNISCHE DETAILS

### **Waarom Backwards Traversal Werkt:**
- Templates zijn contextueel: `{{ handle.value }}` betekent "waarde van laatste stap met die handle"
- Graph traversal infrastructure bestaat al
- Caching voorkomt performance issues
- Fallback gedrag is goed definieerbaar

### **Beperkingen:**
- Kan ambiguity hebben bij multiple handles upstream
- Performance impact bij diepe flows (opgelost door caching)
- Requires changes in beide node_runner en portal

### **Alternatieven Overwogen:**
- ❌ Handle aliasing - te complex
- ❌ Two-pass template resolution - te fragile
- ❌ Service-scoped references - breaking change
- ✅ Backwards flow lookup - beste balans

---

**Last Updated:** 2025-09-24
**Status:** Ready for Implementation
**Risk Level:** Medium (affects core template system)
**Expected Effort:** 2-3 dagen implementation + testing