import React, { useState } from 'react';
import { XMarkIcon, DocumentTextIcon, ChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useTransparencyData } from '@/hooks/useTransparencyData';
import { RawDataView } from './transparency-raw-view';
import { type StorageConfig } from '@/api/agnoTransparencyApi';

interface TransparencyMonitorProps {
  projectId: string;
  sessionId: string;
  sessionName?: string;
  storageConfig: StorageConfig;
  userId?: string;
  onClose: () => void;
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
        active
          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {children}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-red-600 text-lg font-medium mb-2">Error</div>
        <div className="text-gray-600 text-sm">{error}</div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function TransparencyMonitor({ projectId, sessionId, sessionName, storageConfig, userId, onClose }: TransparencyMonitorProps) {
  const [activeTab, setActiveTab] = useState<'raw' | 'timeline' | 'export'>('raw');
  
  // Use real API hook
  const { data: rawData, isLoading, error } = useTransparencyData(
    projectId,
    sessionId,
    storageConfig,
    userId
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-800">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Transparency Monitor
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {sessionName ? `${sessionName} (${sessionId})` : sessionId}
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Session Info */}
      <div className="px-4 py-2 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-600">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Session: {sessionId} • Retrieved: {rawData?.metadata.retrieved_at ? new Date(rawData.metadata.retrieved_at).toLocaleString() : 'N/A'} • 
          Size: {formatBytes(rawData?.metadata.data_size_bytes)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800">
        <TabButton 
          active={activeTab === 'raw'} 
          onClick={() => setActiveTab('raw')}
        >
          <DocumentTextIcon className="w-4 h-4" />
          Raw Data
        </TabButton>
        <TabButton 
          active={activeTab === 'timeline'} 
          onClick={() => setActiveTab('timeline')}
        >
          <ChartBarIcon className="w-4 h-4" />
          Timeline
        </TabButton>
        <TabButton 
          active={activeTab === 'export'} 
          onClick={() => setActiveTab('export')}
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'raw' && <RawDataView rawData={rawData} />}
        {activeTab === 'timeline' && <TimelineViewPlaceholder />}
        {activeTab === 'export' && <ExportViewPlaceholder />}
      </div>
    </div>
  );
}

// Temporary placeholder components

function TimelineViewPlaceholder() {
  return (
    <div className="p-4 text-center text-gray-500">
      Timeline View - Phase 2
    </div>
  );
}

function ExportViewPlaceholder() {
  return (
    <div className="p-4 text-center text-gray-500">
      Export View - Phase 3
    </div>
  );
}