# Chat & Transparency System Refactor Plan

## Huidige Situatie

### Chat System
**Hoe werkt het nu:**
- Chat berichten komen via WebSocket (`useSmartWebSocketListener.ts`)
- Real-time streaming via `RunContent` events naar `chatViewStore`
- Chat geschiedenis wordt opgehaald via `/agno-chat/session-history` endpoint
- Gebruikt `storageConfig` van gekoppelde storage node

**Wat is kapot:**
- Chat geschiedenis endpoint werkt niet meer met Agno v2
- Data komt nu uit PostgreSQL (`AGNO_DB_*` in settings.py), niet uit agent's eigen storage
- De oude flow verwacht v1 storage structuur, maar krijgt v2 runs data

### Transparency System  
**Hoe werkt het nu:**
- Session-niveau transparency via `TransparencyMonitor` component
- Haalt alle data op via `/agno-transparency/session-raw` endpoint
- Toont algemene session info, niet per-response details
- Gebruikt ook `storageConfig` van storage node

**Wat ontbreekt/problemen:**
- Per-response transparency (run-level details)  
- Uitklapbare run objects per AI response
- Direct inzicht in metrics, messages, events per run
- **Oude systeem wordt vervangen** door nieuwe per-response transparency

## Gewenste Situatie

### 1. Chat History uit Runs Data
**Doel:** Chat geschiedenis volledig opbouwen uit PostgreSQL runs table

**Data Structuur (uit jouw JSON example):**
```json
{
  "run_id": "209cee49-aa18-4238-9177-a83c1c2a070e",
  "session_id": "session-j0fd3433h-mffb4p0x", 
  "input": {
    "input_content": "Hallo, hoe gaat het?"  // USER MESSAGE
  },
  "content": "Hallo Dion! Met mij gaat alles goed...", // ASSISTANT RESPONSE
  "created_at": 1757588713,
  "metrics": { "input_tokens": 745, "output_tokens": 22, ... },
  "messages": [...], // Full conversation context
  "events": [...],   // Tool calls, etc.
  "status": "COMPLETED"
}
```

**Transform naar Chat Format:**
```
runs[] → [
  { role: 'user', content: run.input.input_content, timestamp: run.created_at, runId: run.run_id },
  { role: 'assistant', content: run.content, timestamp: run.created_at, runId: run.run_id }
]
```

### 2. Per-Response Transparency
**Doel:** "Transparency" button bij elke AI response

**Wanneer geklikt:**
- Response bericht expandeert
- Toont volledig run object:
  - Metrics (tokens, duration, model)
  - Messages (system prompt, conversation context)
  - Events (tool calls, intermediate steps)
  - Status en error handling

### 3. Smart Streaming Behavior
**Doel:** Intelligente streaming afhankelijk van agent type

#### Team Agents (complexer gedrag):
**Member responses NIET in chat streamen:**
- Team member tool calls/responses blijven alleen in node chat bubbles
- Chat toont groene knipperende bolletjes met member avatars tijdens member activiteit
- Member responses alleen zichtbaar via transparency expansion

**Hoofd team agent WEL in chat streamen:**  
- Zodra hoofd team agent begint met streamen → toon in chat venster
- Dit is de finale response naar de user

#### Single Agents (eenvoudiger):
**Direct streamen:**
- Agent response direct in chat venster (zoals nu)
- Geen team members, dus geen complexity

### 4. Auto-Update Mechanisme
**Flow per agent type:**

**Team Agent Flow:**
1. User stuurt bericht → direct in chat getoond
2. Team members starten → groene bolletjes met avatars (knipperend)
3. Member responses → alleen in node bubbles, NIET in chat 
4. Hoofd team agent start → streamen IN chat venster
5. Run complete → finale response + run_id voor transparency

**Single Agent Flow:**  
1. User stuurt bericht → direct in chat getoond
2. Agent start → begin streaming IN chat venster direct
3. Run complete → finale response + run_id voor transparency

## Technische Details

### Database Setup
- **Main Database** (`DATABASE_*`): Project data, nodes, connections
- **Agno Database** (`AGNO_DB_*`): Runs, sessions, agent execution data
- Chat en transparency halen data uit **Agno Database**

### Table Naming (BELANGRIJK!)
Agno gebruikt **tenant-project prefixed table names**:
- `{tenant}_{project}_agno_sessions` → bevat de runs data
- `{tenant}_{project}_agno_memory` → memory data  
- `{tenant}_{project}_agno_metrics` → metrics data
- `{tenant}_{project}_agno_evals` → evaluation data
- `{tenant}_{project}_agno_knowledge` → knowledge data

**De belangrijkste table voor chat**: `{tenant}_{project}_agno_sessions`
- Deze bevat de runs JSON data zoals in jouw voorbeeld
- Tables bestaan niet per definitie, maar kunnen bestaan als agent ze gebruikt heeft

### API Endpoints

#### Bestaand (kapoet)
- `/agno-chat/session-history` → verwacht v1 storage, krijgt v2 runs
- `/agno-transparency/session-raw` → session-level data

#### Nieuw/Aangepast
- `/agno-chat/runs-history` → runs → chat messages  
- `/agno-chat/run-detail/{run_id}` → volledig run object voor transparency

### Data Flow

#### Chat History Loading:
```
Frontend: selectedPromptNodeId → activeSession, activeUser + projectId
↓
API Call: /agno-chat/session-history (existing endpoint)
↓  
Backend: 
  - Get tenant_project prefix from projectId
  - Query AGNO_DB → SELECT * FROM {tenant}_{project}_agno_sessions WHERE session_id=X
  - Extract runs from JSON data
↓  
Transform: runs[] → ChatMessage[]
↓
Frontend: Chat toont prompt→response→prompt→response
```

#### Transparency per Response:
```
User klikt "Transparency" button bij response
↓
API Call: /agno-chat/run-detail/{run_id}
↓
Backend: Query AGNO_DB → SELECT * FROM runs WHERE run_id=X  
↓
Frontend: Expandeer response met volledig run object
```

## Implementatie Plan

### Fase 1: Chat History Herstellen (Prio 1)
1. ✅ Onderzoek huidige situatie en data structuur
2. ✅ Maak plan document (dit document)
3. 🔧 **Repareer bestaand `/agno-chat/session-history` endpoint** (niet nieuw endpoint)
4. 🔧 Backend: gebruik AGNO_DB in plaats van storageConfig parameter
5. 🔧 Transform runs → ChatMessage format in backend  
6. 🔧 Test chat loading uit runs data
7. 🔧 Implementeer smart streaming logic (team vs single agent)

### Fase 2: Smart Streaming Indicators (Prio 1b)
7. 🔧 Detecteer agent type (team vs single) vanuit node data
8. 🔧 Groene knipperende bolletjes met member avatars
9. 🔧 Streaming filtering: members → alleen node bubbles, hoofd agent → chat
10. 🔧 WebSocket event routing naar juiste UI componenten

#### Store Restructuring Requirements
**Problem**: Mock clear clears both node bubbles AND chat history (not desired)

**Solution**: Separate persistent chat from temporary execution data

```typescript
// chatViewStore structure:
{
  // PERSISTENT - Main chat window (survives between runs)
  messagesBySession: {
    "session-123": [...] // User-agent conversation history
  },
  
  // TEMPORARY - Node chat bubbles (cleared per execution)
  nodeBubblesByNodeId: {
    "node-abc": {
      runId: "run-xyz",
      messages: [...] // Team member responses during execution
    }
  },
  
  // LIVE STATUS - Active team members indicator
  activeTeamMembers: {
    "agent-1": { name: "Cookie Master", avatar: "...", isActive: true },
    "agent-2": { name: "Pastry Master", avatar: "...", isActive: false }
  }
}
```

**Clear Actions**:
- **Mock Clear**: Clears only `nodeBubblesByNodeId` and `activeTeamMembers`
- **Chat Clear**: Clears only `messagesBySession` for current session
- **Never**: Mock clear should never affect main chat history

**Routing Logic**:
- Has `parent_run_id`? → Route to `nodeBubblesByNodeId`
- Main agent/team? → Route to `messagesBySession`
- Team member active? → Update `activeTeamMembers`

### Fase 3: Per-Response Transparency (Prio 2) 
11. 🔧 Add "Transparency" button per assistant response
12. 🔧 Create `/agno-chat/run-detail/{run_id}` endpoint
13. 🔧 Design expanded response UI (run object viewer)
14. 🔧 Show team member responses in transparency expansion
15. 🔧 Implement expandable response met run details

### Fase 4: Oude Transparency System Verwijderen (Prio 3)
16. 🔧 Remove `TransparencyMonitor` component en dependencies
17. 🔧 Remove `useTransparencyData` hook
18. 🔧 Remove `/agno-transparency/*` API endpoints 
19. 🔧 Remove session-level transparency UI van `SessionUserManager`
20. 🔧 Update error handling en loading states
21. 🔧 Performance optimalisaties

## Technische Uitdagingen

### Agent Type Detectie
**Hoe detecteren of agent team of single is?**
- Team agent: `node.path === 'polysynergy_nodes_agno.agno_team.agno_team.AgnoTeam'`  
- Single agent: `node.path === 'polysynergy_nodes_agno.agno_agent.agno_agent.AgnoAgent'`
- Team members info uit node variables (team roster)

### WebSocket Event Routing
**Huidige WebSocket events:**
- `RunContent` / `TeamRunContent` → voor streaming
- Detecteer of event van team member of hoofd agent
- Route naar node bubble vs chat venster

### Member Avatar/Status System
**UI Requirements:**
- Groene knipperende bolletjes tijdens member activiteit
- Member avatars uit team node configuratie  
- Positie: boven chat input of in chat header?

## Vragen/Beslissingen

1. ✅ **Endpoint strategie**: Bestaand `/session-history` repareren (BESLOTEN)
2. **Storage dependency**: Hebben we nog `storageConfig` nodig of alleen project_id?
3. **Member indicator positie**: Waar tonen we de groene bolletjes?
4. **Event filtering**: Hoe onderscheiden we team member vs hoofd agent events?
5. **Performance**: Lazy loading van run details of pre-fetch?

---

*Dit document wordt gebruikt als basis voor implementatie. Update bij wijzigingen.*