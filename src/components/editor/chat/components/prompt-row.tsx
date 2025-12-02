// components/editor/chat/components/message-row.tsx
import React, { useState } from "react";
import { ChatViewMessage } from "@/stores/chatViewStore";
import MarkdownContent from "@/components/editor/chat/components/markdown-content";
import ReferenceDisplay from "@/components/editor/chat/components/reference-display";
import { parseMessageReferences } from "@/utils/referenceParser";
import config from "@/config";

type Props = { message: ChatViewMessage };

export default function PromptRow({ message }: Props) {
  const parsed = parseMessageReferences(message.text);
  const mainText = parsed.text ?? "";
  const refs = parsed.references ?? [];
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Debug: log if message has images
  if (message.images && message.images.length > 0) {
    console.log('[PromptRow] Message has images:', message.images);
  }

  // Generate presigned URL for image (simplified - ideally use backend endpoint)
  const getImageUrl = (filepath: string) => {
    // For now, construct URL assuming public access or using file manager API
    // In production, you'd want to call a backend endpoint to generate presigned URLs
    return `${config.API_URL}/files/${filepath}`;
  };

  return (
    <div className="flex flex-col items-end space-y-1">
      <div className="px-4 py-2 rounded-xl text-sm max-w-[70%] bg-blue-500 text-white">
        <MarkdownContent text={mainText} enableMarkdown={false} />
      </div>

      {message.images && message.images.length > 0 && (
        <div className="max-w-[70%] flex flex-wrap gap-2">
          {message.images.map((img) => {
            // Handle filepath property
            const imagePath = img.filepath;
            if (!imagePath) {
              console.warn('[PromptRow] Image missing filepath/url:', img);
              return null;
            }

            return (
              <div
                key={img.id}
                className="relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setLightboxImage(getImageUrl(imagePath))}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getImageUrl(imagePath)}
                  alt={imagePath.split('/').pop() || 'Uploaded image'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ccc" width="100" height="100"/><text x="50" y="50" text-anchor="middle" font-size="40" fill="%23999">?</text></svg>';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                  {imagePath.split('/').pop()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {refs.length > 0 && (
        <div className="max-w-[70%] text-xs text-gray-500 dark:text-gray-400">
          <ReferenceDisplay references={refs} />
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}