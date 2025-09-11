import { useState, useEffect, useCallback } from 'react';
import { createAgnoTransparencyApi, type StorageConfig, type RawSessionData } from '@/api/agnoTransparencyApi';

interface UseTransparencyDataReturn {
  data: RawSessionData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTransparencyData(
  projectId: string,
  sessionId: string,
  storageConfig: StorageConfig | null,
  userId?: string
): UseTransparencyDataReturn {
  const [data, setData] = useState<RawSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId || !sessionId || !storageConfig) {
      setData(null);
      setError('Missing required parameters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const api = createAgnoTransparencyApi(projectId);
      const result = await api.getSessionRawData(storageConfig, sessionId, userId);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transparency data';
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sessionId, storageConfig, userId]);

  useEffect(() => {
    fetchData();
  }, [projectId, sessionId, storageConfig, userId, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}