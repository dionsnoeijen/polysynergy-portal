import React, { useState } from 'react';
import { DocumentDuplicateIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';

const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

interface RawSessionData {
  session_id: string;
  raw_data: unknown;
  metadata: {
    retrieved_at: string;
    storage_type: string;
    data_size_bytes: number;
  };
  error?: string;
}

interface RawDataViewProps {
  rawData: RawSessionData | null;
}

export function RawDataView({ rawData }: RawDataViewProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');
  const { theme } = useTheme();



  const handleCopyToClipboard = async () => {
    if (!rawData?.raw_data) return;
    
    setCopyStatus('copying');
    try {
      await navigator.clipboard.writeText(JSON.stringify(rawData.raw_data, null, 2));
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopyStatus('idle');
    }
  };


  const handleDownloadJson = () => {
    if (!rawData?.raw_data) return;
    
    const jsonString = JSON.stringify(rawData.raw_data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `transparency-${rawData.session_id}-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!rawData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Data</div>
          <div className="text-sm">No transparency data available</div>
        </div>
      </div>
    );
  }

  if (rawData.error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">Error Loading Data</div>
          <div className="text-sm">{rawData.error}</div>
        </div>
      </div>
    );
  }

  if (!rawData.raw_data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Raw Data</div>
          <div className="text-sm">Session exists but contains no data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* Metadata Info */}
      <div className="px-4 py-2 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-600 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex justify-between items-center">
          <div>
            Storage: {rawData.metadata.storage_type} • 
            Retrieved: {new Date(rawData.metadata.retrieved_at).toLocaleString()}
          </div>
          <div>
            Size: {(rawData.metadata.data_size_bytes / 1024).toFixed(1)} KB
          </div>
        </div>
      </div>

      {/* JSON Tree View */}
      <div className="flex-1 overflow-auto p-4 bg-white dark:bg-zinc-800">
        <div className="bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-600 p-4 min-h-full">
          <ReactJson
            src={rawData.raw_data as Record<string, unknown>}
            name={false}
            theme={theme === 'dark' ? 'monokai' : 'rjv-default'}
            collapsed={1}
            displayDataTypes={false}
            displayObjectSize={true}
            indentWidth={2}
          />
        </div>
      </div>

      {/* Actions Bar */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800">
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={handleCopyToClipboard}
            disabled={copyStatus === 'copying'}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
              ${copyStatus === 'copied' 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
              }
            `}
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
            {copyStatus === 'copying' ? 'Copying...' : copyStatus === 'copied' ? 'Copied!' : 'Copy JSON'}
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Download JSON
          </button>

        </div>
      </div>
    </div>
  );
}