// components/editor/chat/components/markdown-content.tsx
import React, { useMemo, isValidElement } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

type Props = {
  text: string;
  enableMarkdown?: boolean; // default: true
  className?: string;
};

/**
 * Preprocess alleen non-code stukken (```...``` met rust laten).
 * Doelen:
 * - Marker + content op één regel (geen <br> direct na "1." of "-")
 * - Unicode bullets → markdown
 * - URL-artefacten repareren
 * - Overbodige witregels reduceren
 */
function preprocessMarkdown(raw: string): string {
  const parts = raw.split(/(```[\s\S]*?```)/g);

  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (chunk.startsWith("```")) continue;

    let s = chunk;

    // --- Bullets ---
    // Unicode bullet → markdown
    s = s.replace(/^\s*•\s+/gm, "- ");
    // "-\n Tekst" / "*\n Tekst" → "- Tekst" / "* Tekst"
    s = s.replace(/^(\s*[-*])\s*\n+\s+(?=\S)/gm, "$1 ");
    // "-Item" / "*Item" → "- Item" / "* Item"
    s = s.replace(/^(\s*[-*])(?=\S)/gm, "$1 ");

    // --- Genummerde lijsten ---
    // "1.\n Tekst" / "2.\n\n Tekst" → "1. Tekst"
    s = s.replace(/^\s*(\d+)\.\s*\n+\s+(?=\S)/gm, "$1. ");
    // "2 .Titel" → "2. Titel"
    s = s.replace(/^(\s*)(\d+)\s*\.\s*(?=\S)/gm, "$1$2. ");

    // --- URL-fixes ---
    s = s.replace(/:\/\/https?/gi, "https://");                  // ://https → https://
    s = s.replace(/\bhttps?\s*:\/\/?\s*www\./gi, "https://www."); // "https www." / "http www." → https://www.
    s = s.replace(/(^|[\s(])\/\/(www\.)/gi, "$1https://$2");      // //www. → https://www.

    // --- Witruimte ---
    s = s.replace(/[^\S\r\n]{2,}/g, " "); // dubbele spaties → één
    s = s.replace(/\n{3,}/g, "\n\n");     // max 2 lege regels

    parts[i] = s;
  }

  return parts.join("");
}

/**
 * <li> renderer:
 * - verwijdert leading lege tekstnodes / <br> (die door remark-breaks kunnen ontstaan)
 * - unwrapt een enkel <p> binnen li → compacter
 */
const Li: Components["li"] = ({ children }) => {
  const arr = Array.isArray(children) ? children : [children];

  // 1) trim leading lege nodes / <br>
  const trimmed = arr.filter((child, idx) => {
    if (typeof child === "string") {
      return child.trim().length > 0 || idx !== 0;
    }
    if (isValidElement(child) && (child.type as unknown) === "br" && idx === 0) return false;
    return true;
  });

  // 2) unwrap enkel <p>
  if (trimmed.length === 1 && isValidElement(trimmed[0]) && (trimmed[0] as unknown as {type: string}).type === "p") {
    return <li className="m-0">{(trimmed[0] as unknown as {props: {children: React.ReactNode}}).props.children}</li>;
  }

  return <li className="m-0">{trimmed}</li>;
};

const MarkdownContent: React.FC<Props> = ({ text, enableMarkdown = true, className }) => {
  const processed = useMemo(
    () => (enableMarkdown ? preprocessMarkdown(text) : text),
    [text, enableMarkdown]
  );

  if (!enableMarkdown) {
    return <div className={className}>{processed}</div>;
  }

  return (
    <div
      className={[
        // compacte basis
        "whitespace-normal",
        "prose prose-sm dark:prose-invert max-w-none leading-snug",
        // haal default grote margins weg (ook geneste p's in li)
        "prose-p:m-0 prose-li:m-0 prose-ul:my-1 prose-ol:my-1",
        "[&_li>p]:m-0 [&_li>ul]:my-1 [&_li>ol]:my-1",
        // compacte items: alleen kleine afstand tussen siblings
        "[&_ul>li+li]:mt-1 [&_ol>li+li]:mt-1",
        // markers binnen (compactere indents)
        "prose-ul:list-inside prose-ol:list-inside",
        className ?? "",
      ].join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 decoration-sky-500 hover:decoration-2 text-sky-600 dark:text-sky-400"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const inline = !className;
            return inline ? (
              <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">
                {children}
              </code>
            ) : (
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto my-2">
              {children}
            </pre>
          ),
          p: ({ children }) => <p className="m-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside my-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-1">{children}</ol>,
          li: Li,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
              {children}
            </blockquote>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;