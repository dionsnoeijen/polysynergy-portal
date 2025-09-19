import { useState, useEffect } from 'react';
import { createAgnoChatHistoryApi } from '@/api/agnoChatHistoryApi';
import useEditorStore from '@/stores/editorStore';

interface RunDetails {
  run_id: string;
  session_id: string;
  content: string;
  content_type: string;
  model: string;
  model_provider: string;
  status: string;
  created_at: number;
  input?: {
    input_content: string;
  };
  metrics?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    duration: number;
    [key: string]: unknown;
  };
  messages?: Array<{
    content: string;
    role: string;
    created_at: number;
    from_history: boolean;
    [key: string]: unknown;
  }>;
  events?: Array<unknown>;
  member_responses?: Array<unknown>;
}

export function useRunDetails(runId: string | null) {
  const [runDetails, setRunDetails] = useState<RunDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const activeProjectId = useEditorStore((s) => s.activeProjectId);

  useEffect(() => {
    if (!runId || !activeProjectId) {
      setRunDetails(null);
      setError(null);
      return;
    }

    const fetchRunDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[useRunDetails] Fetching run details for runId: ${runId}, projectId: ${activeProjectId}`);
        
        const api = createAgnoChatHistoryApi(activeProjectId);
        const details = await api.getRunDetail(runId);
        
        console.log('[useRunDetails] Successfully fetched run details:', details);
        setRunDetails(details as RunDetails);
      } catch (err) {
        console.error('[useRunDetails] Failed to fetch run details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch run details');
      } finally {
        setLoading(false);
      }
    };

    fetchRunDetails();
  }, [runId, activeProjectId]);

  return { runDetails, loading, error };
}