import React, { useState, useEffect } from 'react';
import { 
  InformationCircleIcon, 
  XMarkIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface AIDisclosureBannerProps {
  sessionId: string;
}

const AIDisclosureBanner: React.FC<AIDisclosureBannerProps> = ({ sessionId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has seen disclosure for this session
    const storageKey = `ai-disclosure-${sessionId}`;
    const hasSeenDisclosure = localStorage.getItem(storageKey);
    
    if (!hasSeenDisclosure && !isDismissed) {
      setIsVisible(true);
    }
  }, [sessionId, isDismissed]);

  const handleDismiss = () => {
    const storageKey = `ai-disclosure-${sessionId}`;
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
        aria-label="Dismiss AI disclosure"
      >
        <XMarkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <CpuChipIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          AI System Disclosure
        </h3>
      </div>

      {/* Main content */}
      <div className="space-y-3 text-xs text-blue-800 dark:text-blue-200">
        <p className="leading-relaxed">
          You are interacting with AI-powered agents. In compliance with the EU AI Act, 
          we provide full transparency about AI operations in this system.
        </p>

        {/* Key features */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <EyeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Full Transparency</div>
              <div className="text-blue-700 dark:text-blue-300">
                Click the eye icon on any AI response to see complete details including 
                model used, tokens consumed, and decision process.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Human Oversight</div>
              <div className="text-blue-700 dark:text-blue-300">
                You maintain full control. You can stop, modify, or override any AI action 
                at any time.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Data Protection</div>
              <div className="text-blue-700 dark:text-blue-300">
                Your data is processed per session, encrypted, and never used for AI training. 
                You can delete your data at any time.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
          <p className="text-[11px] text-blue-600 dark:text-blue-400">
            This system complies with EU AI Act transparency requirements. 
            <a 
              href="/compliance" 
              className="underline hover:text-blue-800 dark:hover:text-blue-200 ml-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more about our AI compliance
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIDisclosureBanner;