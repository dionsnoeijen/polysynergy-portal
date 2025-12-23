// components/editor/chat/components/markdown-content.tsx
import React, { useMemo } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  text: string;
  enableMarkdown?: boolean; // default: true
  className?: string;
};

// Custom components for ReactMarkdown
const markdownComponents: Components = {
  // Links open in new tab
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sky-600 dark:text-sky-400 underline hover:text-sky-700 dark:hover:text-sky-300"
    >
      {children}
    </a>
  ),
  // Code blocks and inline code
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    return isBlock ? (
      <code className="block bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md text-sm overflow-x-auto font-mono">
        {children}
      </code>
    ) : (
      <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-x-auto my-3">
      {children}
    </pre>
  ),
  // Paragraphs with proper spacing
  p: ({ children }) => (
    <p className="mb-4 last:mb-0 leading-relaxed">
      {children}
    </p>
  ),
  // Headers
  h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mt-5 mb-2 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold mt-3 mb-1 first:mt-0">{children}</h4>,
  // Lists with proper spacing
  ul: ({ children }) => (
    <ul className="list-disc pl-6 my-3 space-y-1.5">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 my-3 space-y-1.5">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">
      {children}
    </li>
  ),
  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 my-3 italic text-zinc-600 dark:text-zinc-400">
      {children}
    </blockquote>
  ),
  // Horizontal rules
  hr: () => <hr className="my-4 border-zinc-200 dark:border-zinc-700" />,
  // Strong and emphasis
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
};

const MarkdownContentComponent: React.FC<Props> = ({ text, enableMarkdown = true, className }) => {
  // Simple preprocessing: just normalize excessive whitespace
  const processed = useMemo(() => {
    if (!text) return "";
    // Replace 3+ consecutive newlines with 2 (preserve paragraph breaks)
    return text.replace(/\n{3,}/g, "\n\n");
  }, [text]);

  if (!enableMarkdown) {
    return (
      <div className={`whitespace-pre-wrap ${className ?? ""}`}>
        {processed}
      </div>
    );
  }

  return (
    <div className={`text-zinc-800 dark:text-zinc-200 ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
const MarkdownContent = React.memo(MarkdownContentComponent, (prevProps, nextProps) => {
  return (
    prevProps.text === nextProps.text &&
    prevProps.enableMarkdown === nextProps.enableMarkdown &&
    prevProps.className === nextProps.className
  );
});

export default MarkdownContent;
