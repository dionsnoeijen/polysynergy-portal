export interface SPAProject {
    version: number;
    files: Record<string, string>;
    settings: SPASettings;
}

export interface SPASettings {
    entryPoint: string;
    title: string;
}

export interface FileTreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileTreeNode[];
}

export const DEFAULT_PROJECT: SPAProject = {
    version: 1,
    files: {
        "src/index.jsx": `// Entry point - mounts the App component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,
        "src/App.jsx": `// Main App component
// Use psApi.get('/route-name') or psApi.post('/route-name', data) to fetch data

export default function App() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null);

  // Example: fetch data from a route
  // useEffect(() => {
  //   psApi.get('/my-data').then(setData);
  // }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          My PolySynergy App
        </h1>
        <p className="text-gray-600 mb-4">
          Use psApi to fetch data from your routes.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Count: {count}
          </button>
        </div>
      </div>
    </div>
  );
}`,
        "src/components/ChatWindow.jsx": `// ChatWindow Component - Embedded chat with WebSocket support
// Usage: <ChatWindow embedToken="emb_xxx" apiUrl="https://api.example.com" theme="light" />

function ChatWindow({ embedToken, apiUrl, websocketUrl, className = '', theme = 'light', onReady, onError, onMessageSent, onResponseReceived }) {
    const [config, setConfig] = useState(null);
    const [versionId, setVersionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');

    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const baseApiUrl = apiUrl || window.location.origin;
    const wsUrl = websocketUrl || baseApiUrl.replace(/^http/, 'ws');
    const isDark = theme === 'dark';

    // Fetch config and version ID
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const configResponse = await fetch(\`\${baseApiUrl}/api/v1/public/embedded/config/\`, {
                    headers: { 'X-Embed-Token': embedToken },
                });
                if (!configResponse.ok) throw new Error(\`Failed to fetch config: \${configResponse.statusText}\`);
                const configData = await configResponse.json();
                setConfig(configData);

                const versionResponse = await fetch(\`\${baseApiUrl}/api/v1/public/embedded/version-id/\`, {
                    headers: { 'X-Embed-Token': embedToken },
                });
                if (!versionResponse.ok) throw new Error(\`Failed to fetch version ID: \${versionResponse.statusText}\`);
                const versionData = await versionResponse.json();
                setVersionId(versionData.version_id);

                onReady?.();
            } catch (error) {
                console.error('[ChatWindow] Failed to initialize:', error);
                onError?.(error);
            }
        };
        fetchConfig();
        return () => setMessages([]);
    }, [embedToken, baseApiUrl]);

    // WebSocket connection
    useEffect(() => {
        if (!versionId || !embedToken) return;

        setIsConnecting(true);
        const fullWsUrl = \`\${wsUrl}/execution/\${versionId}?embed_token=\${embedToken}\`;
        const ws = new WebSocket(fullWsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            setIsConnecting(false);
            setConnectionError(null);
        };

        ws.onmessage = (event) => {
            if (event.data === 'pong') return;
            try {
                const parsed = JSON.parse(event.data);
                if (parsed.type === 'chat_stream') {
                    setCurrentStreamingMessage(prev => prev + (parsed.content || ''));
                } else if (parsed.type === 'chat_complete') {
                    setCurrentStreamingMessage(prev => {
                        if (prev) {
                            setMessages(msgs => [...msgs, {
                                id: \`msg-\${Date.now()}\`,
                                sender: 'assistant',
                                content: prev,
                                timestamp: new Date()
                            }]);
                            onResponseReceived?.(prev);
                        }
                        return '';
                    });
                } else if (parsed.type === 'execution_complete') {
                    setIsWaitingForResponse(false);
                    setCurrentStreamingMessage(prev => {
                        if (prev) {
                            setMessages(msgs => [...msgs, {
                                id: \`msg-\${Date.now()}\`,
                                sender: 'assistant',
                                content: prev,
                                timestamp: new Date()
                            }]);
                        }
                        return '';
                    });
                } else if (parsed.type === 'pause') {
                    setMessages(msgs => [...msgs, {
                        id: \`pause-\${Date.now()}\`,
                        sender: 'system',
                        content: parsed.prompt || 'Waiting for your response...',
                        timestamp: new Date(),
                        pause_data: { run_id: parsed.run_id, node_id: parsed.node_id, prompt: parsed.prompt }
                    }]);
                    setIsWaitingForResponse(false);
                } else if (parsed.type === 'error') {
                    setMessages(msgs => [...msgs, {
                        id: \`error-\${Date.now()}\`,
                        sender: 'system',
                        content: \`Error: \${parsed.message || 'Unknown error'}\`,
                        timestamp: new Date()
                    }]);
                    setIsWaitingForResponse(false);
                }
            } catch (e) { /* ignore non-JSON */ }
        };

        ws.onerror = () => {
            setConnectionError('Connection error');
            setIsConnecting(false);
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            if (event.code !== 1000) {
                setTimeout(() => {
                    if (wsRef.current === ws) wsRef.current = null;
                }, 3000);
            }
        };

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 30000);

        return () => {
            clearInterval(pingInterval);
            ws.close(1000);
        };
    }, [versionId, embedToken, wsUrl]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentStreamingMessage, isWaitingForResponse]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = \`\${Math.min(textareaRef.current.scrollHeight, 150)}px\`;
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || isWaitingForResponse || !isConnected) return;

        const message = input.trim();
        setMessages(msgs => [...msgs, {
            id: \`user-\${Date.now()}\`,
            sender: 'user',
            content: message,
            timestamp: new Date()
        }]);
        setInput('');
        setIsWaitingForResponse(true);
        onMessageSent?.(message);

        try {
            const response = await fetch(\`\${baseApiUrl}/api/v1/public/embedded/execute/\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Embed-Token': embedToken },
                body: JSON.stringify({ message, session_id: null })
            });
            if (!response.ok) throw new Error(\`Execute failed: \${response.statusText}\`);
        } catch (error) {
            setIsWaitingForResponse(false);
            setMessages(msgs => [...msgs, {
                id: \`error-\${Date.now()}\`,
                sender: 'system',
                content: \`Failed to send: \${error.message}\`,
                timestamp: new Date()
            }]);
            onError?.(error);
        }
    };

    const handleResume = async (runId, nodeId, response) => {
        setMessages(msgs => [...msgs, {
            id: \`user-\${Date.now()}\`,
            sender: 'user',
            content: response,
            timestamp: new Date()
        }]);
        setIsWaitingForResponse(true);

        try {
            const resumeResponse = await fetch(\`\${baseApiUrl}/api/v1/public/embedded/resume/\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Embed-Token': embedToken },
                body: JSON.stringify({ session_id: null, execution_id: runId, response })
            });
            if (!resumeResponse.ok) throw new Error(\`Resume failed: \${resumeResponse.statusText}\`);
            setMessages(msgs => msgs.filter(m => !(m.pause_data?.run_id === runId && m.pause_data?.node_id === nodeId)));
        } catch (error) {
            setIsWaitingForResponse(false);
            onError?.(error);
        }
    };

    const MessageBubble = ({ message }) => {
        const [resumeInput, setResumeInput] = useState('');
        const isUser = message.sender === 'user';
        const isSystem = message.sender === 'system';
        const isPause = !!message.pause_data;

        return (
            <div className={\`flex \${isUser ? 'justify-end' : 'justify-start'} mb-3\`}>
                <div className={\`max-w-[80%] px-4 py-2 rounded-lg \${
                    isUser ? 'bg-blue-500 text-white' :
                    isSystem ? \`\${isDark ? 'bg-yellow-900 text-yellow-200 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-300'} border\` :
                    \`\${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}\`
                }\`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {isPause && (
                        <div className="mt-3 space-y-2">
                            <input
                                type="text"
                                value={resumeInput}
                                onChange={(e) => setResumeInput(e.target.value)}
                                placeholder="Type your response..."
                                className={\`w-full px-3 py-2 text-sm border rounded \${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}\`}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && resumeInput.trim()) { e.preventDefault(); handleResume(message.pause_data.run_id, message.pause_data.node_id, resumeInput.trim()); setResumeInput(''); } }}
                            />
                            <button
                                onClick={() => { if (resumeInput.trim()) { handleResume(message.pause_data.run_id, message.pause_data.node_id, resumeInput.trim()); setResumeInput(''); } }}
                                disabled={!resumeInput.trim()}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >Continue</button>
                        </div>
                    )}
                    <span className="text-xs opacity-60 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                    </span>
                </div>
            </div>
        );
    };

    const hasContent = messages.length > 0 || currentStreamingMessage || isWaitingForResponse;

    return (
        <div className={\`flex flex-col h-full border rounded-lg overflow-hidden \${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} \${className}\`}>
            {/* Header */}
            <div className={\`flex items-center gap-2 px-4 py-3 border-b \${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}\`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
                <h2 className={\`font-medium \${isDark ? 'text-white' : 'text-gray-800'}\`}>{config?.chat_window_name || 'Chat'}</h2>
                <div className="ml-auto flex items-center gap-2">
                    <span className={\`w-2 h-2 rounded-full \${isConnected ? 'bg-green-500' : connectionError ? 'bg-red-500' : 'bg-yellow-500'}\`} />
                    <span className={\`text-xs \${isDark ? 'text-gray-400' : 'text-gray-500'}\`}>
                        {isConnected ? 'Connected' : connectionError ? 'Error' : 'Connecting...'}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {!hasContent && (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <p>Start a conversation...</p>
                    </div>
                )}
                {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                {currentStreamingMessage && (
                    <div className="flex justify-start mb-3">
                        <div className={\`max-w-[80%] px-4 py-2 rounded-lg \${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}\`}>
                            <p className="text-sm whitespace-pre-wrap">{currentStreamingMessage}</p>
                            <span className={\`inline-block w-2 h-4 \${isDark ? 'bg-gray-500' : 'bg-gray-400'} animate-pulse ml-1\`} />
                        </div>
                    </div>
                )}
                {isWaitingForResponse && !currentStreamingMessage && (
                    <div className="flex justify-start mb-3">
                        <div className={\`px-4 py-2 rounded-lg \${isDark ? 'bg-gray-700' : 'bg-gray-100'}\`}>
                            <div className="flex space-x-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={\`border-t p-4 \${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}\`}>
                <div className="flex items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
                        disabled={isWaitingForResponse || !isConnected}
                        rows={1}
                        className={\`flex-1 resize-none px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed \${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}\`}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isWaitingForResponse || !isConnected || !input.trim()}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                    </button>
                </div>
                {!isConnected && (
                    <p className={\`text-xs mt-2 \${isDark ? 'text-yellow-400' : 'text-yellow-600'}\`}>
                        Connecting to chat server...
                    </p>
                )}
            </div>
        </div>
    );
}`
    },
    settings: {
        entryPoint: "src/index.jsx",
        title: "My App"
    }
};

/**
 * Build a tree structure from flat file paths
 */
export function buildFileTree(files: Record<string, string>): FileTreeNode[] {
    const root: FileTreeNode[] = [];
    const paths = Object.keys(files).sort();

    for (const path of paths) {
        const parts = path.split('/');
        let currentLevel = root;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;
            const currentPath = parts.slice(0, i + 1).join('/');

            let existing = currentLevel.find(n => n.name === part);

            if (!existing) {
                existing = {
                    name: part,
                    path: currentPath,
                    type: isFile ? 'file' : 'folder',
                    children: isFile ? undefined : []
                };
                currentLevel.push(existing);
            }

            if (!isFile && existing.children) {
                currentLevel = existing.children;
            }
        }
    }

    return sortFileTree(root);
}

/**
 * Sort file tree: folders first, then alphabetically
 */
function sortFileTree(nodes: FileTreeNode[]): FileTreeNode[] {
    return nodes.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    }).map(node => ({
        ...node,
        children: node.children ? sortFileTree(node.children) : undefined
    }));
}

/**
 * Get file extension for language detection
 */
export function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'css':
            return 'css';
        case 'html':
            return 'html';
        case 'json':
            return 'json';
        case 'md':
            return 'markdown';
        default:
            return 'javascript';
    }
}

/**
 * Get file icon based on extension
 */
export function getFileIcon(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js':
        case 'jsx':
            return 'JS';
        case 'ts':
        case 'tsx':
            return 'TS';
        case 'css':
            return 'CSS';
        case 'html':
            return 'HTML';
        case 'json':
            return 'JSON';
        default:
            return 'FILE';
    }
}
