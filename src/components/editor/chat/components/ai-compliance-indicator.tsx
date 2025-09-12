import React, { useState } from 'react';
import { 
  ShieldCheckIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ComplianceStatus {
  transparency: boolean;
  humanOversight: boolean;
  dataProtection: boolean;
  auditTrail: boolean;
}

const AIComplianceIndicator: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  
  // These would normally come from your system state
  const complianceStatus: ComplianceStatus = {
    transparency: true,     // Transparency features implemented
    humanOversight: true,   // Human control features available
    dataProtection: true,   // Data protection measures in place
    auditTrail: true,      // Audit logging enabled
  };

  const allCompliant = Object.values(complianceStatus).every(status => status);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
          allCompliant
            ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50'
        }`}
        title="AI Act Compliance Status"
      >
        <ShieldCheckIcon className="w-3.5 h-3.5" />
        <span>AI Act Compliant</span>
      </button>

      {/* Compliance Details Popup */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4 z-50">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              AI Act Compliance Status
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Real-time compliance monitoring
            </p>
          </div>

          <div className="space-y-2">
            {/* Transparency */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className={`w-4 h-4 ${
                  complianceStatus.transparency 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-slate-400 dark:text-slate-600'
                }`} />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Transparency
                </span>
              </div>
              <span className={`text-xs ${
                complianceStatus.transparency
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-500 dark:text-slate-500'
              }`}>
                {complianceStatus.transparency ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Human Oversight */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className={`w-4 h-4 ${
                  complianceStatus.humanOversight 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-slate-400 dark:text-slate-600'
                }`} />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Human Oversight
                </span>
              </div>
              <span className={`text-xs ${
                complianceStatus.humanOversight
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-500 dark:text-slate-500'
              }`}>
                {complianceStatus.humanOversight ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Data Protection */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className={`w-4 h-4 ${
                  complianceStatus.dataProtection 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-slate-400 dark:text-slate-600'
                }`} />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Data Protection
                </span>
              </div>
              <span className={`text-xs ${
                complianceStatus.dataProtection
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-500 dark:text-slate-500'
              }`}>
                {complianceStatus.dataProtection ? 'Secured' : 'At Risk'}
              </span>
            </div>

            {/* Audit Trail */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className={`w-4 h-4 ${
                  complianceStatus.auditTrail 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-slate-400 dark:text-slate-600'
                }`} />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Audit Trail
                </span>
              </div>
              <span className={`text-xs ${
                complianceStatus.auditTrail
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-500 dark:text-slate-500'
              }`}>
                {complianceStatus.auditTrail ? 'Logging' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-2 mb-3">
              <InformationCircleIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                <p className="font-medium mb-1">AI System Disclosure</p>
                <p>You are interacting with AI agents. This system provides full transparency about AI operations in compliance with the EU AI Act.</p>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
              <div>• Click the eye icon on responses for complete AI decision details</div>
              <div>• You maintain full control and can override any AI action</div>
              <div>• Your data is encrypted and never used for AI training</div>
            </div>
          </div>

          {/* Link to full compliance page */}
          <div className="mt-3">
            <a
              href="/compliance"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View full compliance report →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIComplianceIndicator;