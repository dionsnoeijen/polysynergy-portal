// Main component
export { default as ChatWindow } from './ChatWindow';
export type { ChatWindowProps } from './ChatWindow';

// Store
export { useEmbeddedChatStore } from './stores/embeddedChatStore';
export type { ChatMessage } from './stores/embeddedChatStore';

// Hooks
export { useEmbeddedWebSocket } from './hooks/useEmbeddedWebSocket';

// Sub-components (for advanced customization)
export { default as EmbeddedMessages } from './components/EmbeddedMessages';
export { default as EmbeddedPromptField } from './components/EmbeddedPromptField';
