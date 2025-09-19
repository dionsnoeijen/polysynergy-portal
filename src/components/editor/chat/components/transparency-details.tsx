import React, { useState } from 'react';
import { useRunDetails } from '@/hooks/useRunDetails';
import { 
  ClockIcon, 
  CpuChipIcon, 
  ChatBubbleLeftRightIcon, 
  BoltIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  WrenchIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface TransparencyDetailsProps {
  runId: string;
}

interface ExpandableSection {
  messages: boolean;
  memberResponses: Record<number, boolean>;
  toolCalls: Record<string, boolean>;
}

const TransparencyDetails: React.FC<TransparencyDetailsProps> = ({ runId }) => {
  const { runDetails, loading, error } = useRunDetails(runId);
  const [expanded, setExpanded] = useState<ExpandableSection>({
    messages: false,
    memberResponses: {},
    toolCalls: {}
  });

  const toggleMessagesExpanded = () => {
    setExpanded(prev => ({ ...prev, messages: !prev.messages }));
  };

  const toggleMemberExpanded = (index: number) => {
    setExpanded(prev => ({
      ...prev,
      memberResponses: {
        ...prev.memberResponses,
        [index]: !prev.memberResponses[index]
      }
    }));
  };

  const toggleToolExpanded = (key: string) => {
    setExpanded(prev => ({
      ...prev,
      toolCalls: {
        ...prev.toolCalls,
        [key]: !prev.toolCalls[key]
      }
    }));
  };

  if (loading) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400 py-2">
        Loading transparency details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-600 dark:text-red-400 py-2">
        Error loading details: {error}
      </div>
    );
  }

  if (!runDetails) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400 py-2">
        No details available
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium mb-1">
            <BoltIcon className="w-3 h-3" />
            Status
          </div>
          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
            runDetails.status === 'COMPLETED' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
          }`}>
            {runDetails.status}
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium mb-1">
            <CpuChipIcon className="w-3 h-3" />
            Model
          </div>
          <div className="text-slate-800 dark:text-slate-200">
            {runDetails.model} ({runDetails.model_provider})
          </div>
        </div>
      </div>

      {/* Metrics */}
      {runDetails.metrics && (
        <div>
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium mb-2">
            <ClockIcon className="w-3 h-3" />
            Performance Metrics
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
            <div>
              <div className="text-slate-600 dark:text-slate-400">Input Tokens</div>
              <div className="font-mono text-slate-900 dark:text-slate-100">
                {runDetails.metrics.input_tokens?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-slate-600 dark:text-slate-400">Output Tokens</div>
              <div className="font-mono text-slate-900 dark:text-slate-100">
                {runDetails.metrics.output_tokens?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-slate-600 dark:text-slate-400">Total Tokens</div>
              <div className="font-mono text-slate-900 dark:text-slate-100">
                {runDetails.metrics.total_tokens?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-slate-600 dark:text-slate-400">Duration</div>
              <div className="font-mono text-slate-900 dark:text-slate-100">
                {runDetails.metrics.duration ? formatDuration(runDetails.metrics.duration) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Context - Expandable */}
      {runDetails.messages && runDetails.messages.length > 0 && (
        <div>
          <button
            onClick={toggleMessagesExpanded}
            className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium mb-2 hover:text-slate-900 dark:hover:text-slate-100"
          >
            {expanded.messages ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
            <ChatBubbleLeftRightIcon className="w-3 h-3" />
            Conversation Context ({runDetails.messages.length} messages)
          </button>
          <div className={`space-y-2 text-xs ${expanded.messages ? 'max-h-96' : 'max-h-48'} overflow-y-auto`}>
            {runDetails.messages.slice(0, expanded.messages ? undefined : 3).map((message, index) => (
              <div key={index} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    message.role === 'user' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      : message.role === 'assistant'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                  }`}>
                    {message.role}
                  </span>
                  {message.from_history && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      (from history)
                    </span>
                  )}
                </div>
                <div className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {expanded.messages || index < 3 ? message.content : (
                    <>
                      {message.content.substring(0, 150)}
                      {message.content.length > 150 && '...'}
                    </>
                  )}
                </div>
              </div>
            ))}
            {!expanded.messages && runDetails.messages.length > 3 && (
              <button
                onClick={toggleMessagesExpanded}
                className="w-full text-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs py-2"
              >
                Show {runDetails.messages.length - 3} more messages
              </button>
            )}
          </div>
        </div>
      )}

      {/* Team Member Responses - Expandable */}
      {runDetails.member_responses && runDetails.member_responses.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium mb-2">
            <UserGroupIcon className="w-3 h-3" />
            Team Member Responses ({runDetails.member_responses.length})
          </div>
          <div className="space-y-3">
            {(runDetails.member_responses as unknown[]).map((member: unknown, index: number) => {
              const isExpanded: boolean = expanded.memberResponses[index] || false;
              const toolCallKey = `member-${index}`;
              const memberData = member as {
                agent_name?: string;
                model?: string;
                content?: string;
                metrics?: {
                  duration?: number;
                  input_tokens?: number;
                  output_tokens?: number;
                };
                tools?: unknown[];
              };
              
              return (
                <div key={index} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => toggleMemberExpanded(index)}
                      className="flex items-center gap-2 hover:opacity-80"
                    >
                      {isExpanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
                        {memberData.agent_name || 'Team Member'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                        {memberData.model}
                      </span>
                    </button>
                    {memberData.metrics?.duration && (
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">
                        {formatDuration(memberData.metrics.duration)}
                      </span>
                    )}
                  </div>
                  
                  {/* Member Response Content */}
                  <div className="text-xs text-slate-700 dark:text-slate-200 mb-2 whitespace-pre-wrap">
                    {memberData.content || ''}
                  </div>
                  
                  {/* Member Metrics */}
                  {memberData.metrics && (
                    <div className="flex gap-4 text-[10px] text-slate-600 dark:text-slate-400">
                      <span>Input: {memberData.metrics.input_tokens} tokens</span>
                      <span>Output: {memberData.metrics.output_tokens} tokens</span>
                    </div>
                  )}
                  
                  {/* Tool Calls - Expandable */}
                  {memberData.tools && memberData.tools.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => toggleToolExpanded(toolCallKey)}
                        className="flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300 font-medium mb-2 hover:text-slate-900 dark:hover:text-slate-100"
                      >
                        {expanded.toolCalls[toolCallKey] ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                        <WrenchIcon className="w-3 h-3" />
                        {memberData.tools.length} Tool Call{memberData.tools.length > 1 ? 's' : ''}
                      </button>
                      
                      {expanded.toolCalls[toolCallKey] && (
                        <div className="space-y-2">
                          {memberData.tools.map((tool: unknown, toolIndex: number) => {
                            const toolData = tool as {
                              tool_name?: string;
                              name?: string;
                              tool_args?: unknown;
                              arguments?: string;
                              result?: unknown;
                            };
                            
                            return (
                              <div key={toolIndex} className="bg-slate-50 dark:bg-slate-900 rounded p-2 text-[10px]">
                                <div className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                                  {toolData.tool_name || toolData.name || 'Unknown Tool'}
                                </div>
                                {Boolean(toolData.tool_args) && (
                                  <div className="text-slate-600 dark:text-slate-400 font-mono">
                                    <strong>Args:</strong> {JSON.stringify(toolData.tool_args, null, 2)}
                                  </div>
                                )}
                                {Boolean(toolData.arguments) && (
                                  <div className="text-slate-600 dark:text-slate-400 font-mono">
                                    <strong>Args:</strong> {JSON.stringify(JSON.parse(toolData.arguments!), null, 2)}
                                  </div>
                                )}
                                {Boolean(toolData.result) && (
                                  <div className="text-slate-600 dark:text-slate-400 mt-1">
                                    <strong>Result:</strong> {typeof toolData.result === 'string' ? toolData.result : JSON.stringify(toolData.result, null, 2)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events */}
      {runDetails.events && runDetails.events.length > 0 && (
        <div>
          <div className="text-slate-700 dark:text-slate-300 font-medium mb-2">
            Events ({runDetails.events.length})
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {runDetails.events.length} event(s) recorded
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="pt-3 border-t border-slate-300 dark:border-slate-600">
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <div><strong>Run ID:</strong> <span className="font-mono text-slate-800 dark:text-slate-200">{runDetails.run_id}</span></div>
          <div><strong>Session:</strong> <span className="font-mono text-slate-800 dark:text-slate-200">{runDetails.session_id}</span></div>
          <div><strong>Created:</strong> <span className="text-slate-800 dark:text-slate-200">{formatTimestamp(runDetails.created_at)}</span></div>
        </div>
      </div>
    </div>
  );
};

export default TransparencyDetails;