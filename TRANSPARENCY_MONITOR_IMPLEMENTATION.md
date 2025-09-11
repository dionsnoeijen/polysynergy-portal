# AI Transparency Monitor Implementation Plan

## Overview

This document outlines the simplified approach for building an AI Transparency Monitor that provides full visibility into AI agent sessions by returning raw JSON data from Agno storage and handling all parsing and presentation on the frontend.

## Architecture Overview - Simplified Approach

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat Window   │    │   API Endpoint  │    │  Agno Storage   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ transparency/   │    │ AgentSession    │
│ │Transparency │ │◄──►│ session-raw     │◄──►│ session.to_dict()│
│ │   Button    │ │    │                 │    │                 │
│ └─────────────┘ │    │ Returns:        │    │ TeamSession     │
│                 │    │ Raw JSON only   │    │ session.to_dict()│
│ TransparencyMon │    │                 │    │                 │
│ ┌─────────────┐ │    │                 │    │                 │
│ │ [Raw View]  │ │    │                 │    │                 │
│ │ [Timeline]  │ │    │                 │    │                 │
│ │ [Export]    │ │    │                 │    │                 │
│ └─────────────┘ │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 1. Backend Implementation (Simplified)

### 1.1 New API Endpoint

**File**: `/api-local/api/v1/project/agno_transparency.py`

Following the pattern of `agno_chat_history.py`, create a minimal service that just returns raw session data:

```python
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict, Any
from pydantic import BaseModel

from models import Project
from services.agno_transparency_service import AgnoTransparencyService, get_agno_transparency_service
from utils.get_current_account import get_project_or_403

router = APIRouter()

class StorageConfig(BaseModel):
    type: str  # 'LocalAgentStorage' or 'DynamoDBAgentStorage'
    table_name: Optional[str] = None
    db_file: Optional[str] = None
    region_name: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    endpoint_url: Optional[str] = None

class TransparencyRequest(BaseModel):
    storage_config: StorageConfig
    session_id: str
    user_id: Optional[str] = None

@router.post("/session-raw", response_model=Dict[str, Any])
async def get_session_raw_data(
    request: TransparencyRequest,
    _: Project = Depends(get_project_or_403),
    service: AgnoTransparencyService = Depends(get_agno_transparency_service)
):
    """
    Retrieve raw session data from Agno storage.
    Returns the complete session.to_dict() with no processing.
    All data extraction and parsing is handled on the frontend.
    """
    try:
        raw_data = await service.get_session_raw_data(
            storage_config=request.storage_config.dict(),
            session_id=request.session_id,
            user_id=request.user_id
        )
        return raw_data
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve session data: {str(e)}"
        )
```

### 1.2 Simplified Transparency Service

**File**: `/api-local/services/agno_transparency_service.py`

```python
from typing import Optional, Dict, Any
from datetime import datetime, timezone

try:
    from agno.storage.sqlite import SqliteStorage
    from agno.storage.dynamodb import DynamoDbStorage
    AGNO_AVAILABLE = True
except ImportError:
    AGNO_AVAILABLE = False

class AgnoTransparencyService:
    """
    Simplified service that returns raw Agno session data.
    No processing or extraction - just passes through session.to_dict().
    """
    
    def __init__(self):
        if not AGNO_AVAILABLE:
            raise ImportError("Agno storage modules are required for transparency functionality")
    
    async def get_session_raw_data(
        self,
        storage_config: Dict[str, Any],
        session_id: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get raw session data using the same pattern as agno_chat_history_service.
        Returns session.to_dict() with minimal processing.
        """
        try:
            storage_type = storage_config.get('type')
            
            if storage_type == 'LocalAgentStorage':
                storage = self._get_sqlite_storage(storage_config)
                session = storage.read(session_id, user_id)
            elif storage_type == 'DynamoDBAgentStorage':
                storage = self._get_dynamodb_storage(storage_config)
                session = storage.read(session_id)
            else:
                raise ValueError(f"Unsupported storage type: {storage_type}")

            if not session:
                return {
                    "session_id": session_id,
                    "error": "Session not found",
                    "raw_data": None,
                    "metadata": {
                        "retrieved_at": datetime.now(timezone.utc).isoformat(),
                        "storage_type": storage_type
                    }
                }
            
            # Convert session to dict - this is the complete raw data
            session_dict = session.to_dict() if hasattr(session, 'to_dict') else session.__dict__
            
            return {
                "session_id": session_id,
                "raw_data": session_dict,
                "metadata": {
                    "retrieved_at": datetime.now(timezone.utc).isoformat(),
                    "storage_type": storage_type,
                    "data_size_bytes": len(str(session_dict))
                }
            }
            
        except Exception as e:
            print(f"Error retrieving raw session data: {e}")
            import traceback
            traceback.print_exc()
            return {
                "session_id": session_id,
                "error": str(e),
                "raw_data": None,
                "metadata": {
                    "retrieved_at": datetime.now(timezone.utc).isoformat(),
                    "storage_type": storage_config.get('type')
                }
            }
    
    def _get_sqlite_storage(self, config: Dict[str, Any]) -> SqliteStorage:
        """Same as agno_chat_history_service."""
        table_name = config.get('table_name', 'agent_sessions')
        db_file = config.get('db_file', 'tmp/agent_storage.db')
        
        return SqliteStorage(
            table_name=table_name,
            db_file=db_file
        )
    
    def _get_dynamodb_storage(self, config: Dict[str, Any]) -> DynamoDbStorage:
        """Same as agno_chat_history_service."""
        import os
        from core.settings import settings
        
        table_name = config.get('table_name', 'agno_agent_sessions')
        region_name = config.get('region_name', 'eu-central-1')
        
        aws_access_key_id = settings.AWS_ACCESS_KEY_ID or os.environ.get("AWS_ACCESS_KEY_ID")
        aws_secret_access_key = settings.AWS_SECRET_ACCESS_KEY or os.environ.get("AWS_SECRET_ACCESS_KEY")
        endpoint_url = config.get('endpoint_url')
        
        return DynamoDbStorage(
            table_name=table_name,
            region_name=region_name,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            endpoint_url=endpoint_url
        )

def get_agno_transparency_service() -> AgnoTransparencyService:
    """Dependency injection for AgnoTransparencyService."""
    return AgnoTransparencyService()
```

## 2. Frontend Implementation

### 2.1 Data Processing Hooks

Since all data extraction is now handled on the frontend, create React hooks for parsing the raw JSON:

**File**: `src/hooks/useTransparencyData.ts`

```typescript
import { useMemo } from 'react';

interface RawSessionData {
  session_id: string;
  raw_data: any;
  metadata: {
    retrieved_at: string;
    storage_type: string;
    data_size_bytes: number;
  };
  error?: string;
}

interface ParsedSessionData {
  conversations: Conversation[];
  modelUsage: ModelUsage;
  toolExecutions: ToolExecution[];
  performanceMetrics: PerformanceMetrics;
  sessionMetadata: SessionMetadata;
}

export function useTransparencyData(rawData: RawSessionData | null) {
  const parsedData = useMemo(() => {
    if (!rawData?.raw_data) return null;
    
    return parseAgnoSessionData(rawData.raw_data);
  }, [rawData]);

  return {
    rawData,
    parsedData,
    isLoading: false,
    error: rawData?.error || null
  };
}

function parseAgnoSessionData(sessionData: any): ParsedSessionData {
  const memory = sessionData.memory ? JSON.parse(sessionData.memory) : {};
  const runs = memory.runs || [];
  
  return {
    conversations: parseConversations(runs),
    modelUsage: parseModelUsage(runs, sessionData),
    toolExecutions: parseToolExecutions(runs),
    performanceMetrics: parsePerformanceMetrics(runs),
    sessionMetadata: parseSessionMetadata(sessionData)
  };
}

function parseConversations(runs: any[]): Conversation[] {
  return runs.map((run, idx) => ({
    runId: idx + 1,
    timestamp: run.response?.created_at,
    messages: run.messages || [],
    userInput: run.messages?.find((m: any) => m.role === 'user'),
    aiResponse: run.messages?.find((m: any) => m.role === 'assistant'),
    thinking: run.messages?.find((m: any) => m.thinking)?.thinking,
    reasoning: run.messages?.find((m: any) => m.reasoning_content)?.reasoning_content
  }));
}

// Additional parsing functions...
```

### 2.2 Component Structure

**Main Transparency Monitor Component**

```typescript
interface TransparencyMonitorProps {
  sessionId: string;
  storageConfig: StorageConfig;
  onClose: () => void;
}

export function TransparencyMonitor({ sessionId, storageConfig, onClose }: TransparencyMonitorProps) {
  const [activeTab, setActiveTab] = useState<'raw' | 'timeline' | 'export'>('raw');
  const { data: rawData, isLoading, error } = useTransparencyAPI(sessionId, storageConfig);
  const { parsedData } = useTransparencyData(rawData);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">AI Transparency Monitor</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      {/* Session Info */}
      <div className="px-4 py-2 bg-gray-50 border-b">
        <div className="text-sm text-gray-600">
          Session: {sessionId} • Retrieved: {rawData?.metadata.retrieved_at} • 
          Size: {formatBytes(rawData?.metadata.data_size_bytes)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <TabButton 
          active={activeTab === 'raw'} 
          onClick={() => setActiveTab('raw')}
        >
          📄 Raw Data
        </TabButton>
        <TabButton 
          active={activeTab === 'timeline'} 
          onClick={() => setActiveTab('timeline')}
        >
          📈 Timeline
        </TabButton>
        <TabButton 
          active={activeTab === 'export'} 
          onClick={() => setActiveTab('export')}
        >
          💾 Export
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'raw' && <RawDataView rawData={rawData} />}
        {activeTab === 'timeline' && <TimelineView parsedData={parsedData} />}
        {activeTab === 'export' && <ExportView rawData={rawData} parsedData={parsedData} />}
      </div>
    </div>
  );
}
```

### 2.3 Raw Data View Component

**File**: `src/components/editor/chat/components/transparency-raw-view.tsx`

```typescript
interface RawDataViewProps {
  rawData: RawSessionData | null;
}

export function RawDataView({ rawData }: RawDataViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  if (!rawData?.raw_data) {
    return (
      <div className="p-4 text-center text-gray-500">
        No raw data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search in JSON data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {/* JSON Tree View */}
      <div className="flex-1 overflow-auto p-4">
        <JsonTreeView 
          data={rawData.raw_data} 
          searchTerm={searchTerm}
          expandedPaths={expandedPaths}
          onToggleExpanded={(path) => {
            const newExpanded = new Set(expandedPaths);
            if (newExpanded.has(path)) {
              newExpanded.delete(path);
            } else {
              newExpanded.add(path);
            }
            setExpandedPaths(newExpanded);
          }}
        />
      </div>

      {/* Actions */}
      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(rawData.raw_data, null, 2))}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📋 Copy to Clipboard
        </button>
        <button
          onClick={() => setExpandedPaths(new Set())}
          className="ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          🔄 Collapse All
        </button>
      </div>
    </div>
  );
}
```

### 2.4 Timeline View (Future)

For the timeline view, we'll parse the raw data into a chronological display of interactions, tool calls, and AI reasoning steps. This will be implemented in Phase 2.

## 3. Integration with Chat Window

Add transparency button to existing chat interface:

```typescript
// In chat.tsx
const [showTransparency, setShowTransparency] = useState(false);

// Add button near existing chat controls
<button 
  onClick={() => setShowTransparency(!showTransparency)}
  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded"
>
  🔍 Transparency
</button>

// Conditional rendering
{showTransparency ? (
  <TransparencyMonitor 
    sessionId={activeSessionId}
    storageConfig={getStorageConfig()}
    onClose={() => setShowTransparency(false)}
  />
) : (
  <NormalChatInterface />
)}
```

## 4. Implementation Timeline

### Phase 1: Raw Data View (Week 1)
- [x] Create simplified backend endpoint that returns `session.to_dict()`
- [x] Build basic transparency service following `agno_chat_history_service` pattern
- [x] Create transparency monitor component with raw data view
- [x] Add JSON tree viewer with search and expand/collapse
- [x] Integrate transparency button into chat interface

### Phase 2: Timeline View (Week 2)  
- [ ] Build data parsing hooks for frontend processing
- [ ] Create timeline component showing conversation flow
- [ ] Add message details, tool calls, and reasoning display
- [ ] Implement interactive timeline with expandable sections

### Phase 3: Enhanced Features (Week 3)
- [ ] Add export functionality (JSON, CSV formats)
- [ ] Create performance metrics visualization  
- [ ] Add model usage analysis
- [ ] Implement data filtering and search across all views

### Phase 4: Polish (Week 4)
- [ ] Optimize performance for large datasets
- [ ] Add loading states and error handling
- [ ] Improve visual design and UX
- [ ] Add accessibility features

## 5. Benefits of Simplified Approach

**Backend Benefits:**
- ✅ **Simple**: Just passes through `session.to_dict()`
- ✅ **Reliable**: Minimal processing means fewer failure points
- ✅ **Fast**: No complex data extraction logic
- ✅ **Maintainable**: Easy to understand and modify

**Frontend Benefits:**  
- ✅ **Flexible**: Can parse data any way we want
- ✅ **Extensible**: Easy to add new data views
- ✅ **Debuggable**: Full access to raw data for troubleshooting
- ✅ **Performance**: Client-side processing can be optimized incrementally

**Development Benefits:**
- ✅ **Faster iteration**: Changes don't require backend deployment
- ✅ **Better testing**: Can test with mock data easily
- ✅ **Clear separation**: Backend does storage, frontend does presentation
- ✅ **Future-proof**: Raw data access supports unknown future requirements

This simplified approach gets us to a working transparency monitor faster while providing maximum flexibility for future enhancements.