import React from 'react';
import {
    DocumentIcon,
    PhotoIcon,
    VideoCameraIcon,
    SpeakerWaveIcon,
    ArchiveBoxIcon,
    CodeBracketIcon,
    DocumentTextIcon,
    TableCellsIcon,
    PresentationChartBarIcon,
    CircleStackIcon,
    CogIcon,
    DocumentChartBarIcon,
    CommandLineIcon,
} from '@heroicons/react/24/outline';

export interface FileIconConfig {
    icon: React.ReactElement;
    color: string;
    label: string;
}

const getFileTypeConfig = (contentType: string, fileName: string): FileIconConfig => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Images
    if (contentType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(ext)) {
        return {
            icon: <PhotoIcon className="w-full h-full" />,
            color: 'text-green-500',
            label: ext.toUpperCase() || 'IMG'
        };
    }
    
    // Videos
    if (contentType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'].includes(ext)) {
        return {
            icon: <VideoCameraIcon className="w-full h-full" />,
            color: 'text-red-500',
            label: ext.toUpperCase() || 'VID'
        };
    }
    
    // Audio
    if (contentType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) {
        return {
            icon: <SpeakerWaveIcon className="w-full h-full" />,
            color: 'text-purple-500',
            label: ext.toUpperCase() || 'AUD'
        };
    }
    
    // Archives
    if (contentType.includes('zip') || contentType.includes('tar') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
        return {
            icon: <ArchiveBoxIcon className="w-full h-full" />,
            color: 'text-orange-500',
            label: ext.toUpperCase() || 'ZIP'
        };
    }
    
    // Code files
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-yellow-500',
            label: ext.toUpperCase()
        };
    }
    
    if (['py', 'pyw'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-blue-600',
            label: 'PY'
        };
    }
    
    if (['html', 'htm'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-orange-600',
            label: 'HTML'
        };
    }
    
    if (['css', 'scss', 'sass', 'less'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-blue-500',
            label: 'CSS'
        };
    }
    
    if (['java'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-red-600',
            label: 'JAVA'
        };
    }
    
    if (['php'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-purple-600',
            label: 'PHP'
        };
    }
    
    if (['rb', 'ruby'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-red-500',
            label: 'RUBY'
        };
    }
    
    if (['go'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-cyan-500',
            label: 'GO'
        };
    }
    
    if (['rs', 'rust'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-orange-700',
            label: 'RUST'
        };
    }
    
    if (['c', 'h'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-blue-700',
            label: 'C'
        };
    }
    
    if (['cpp', 'cc', 'cxx', 'hpp'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-blue-800',
            label: 'C++'
        };
    }
    
    if (['cs'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-green-600',
            label: 'C#'
        };
    }
    
    // Shell scripts
    if (['sh', 'bash', 'zsh', 'fish', 'bat', 'cmd', 'ps1'].includes(ext)) {
        return {
            icon: <CommandLineIcon className="w-full h-full" />,
            color: 'text-gray-600',
            label: ext.toUpperCase()
        };
    }
    
    // Data/Config files
    if (['json'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-green-500',
            label: 'JSON'
        };
    }
    
    if (['xml'].includes(ext)) {
        return {
            icon: <CodeBracketIcon className="w-full h-full" />,
            color: 'text-orange-500',
            label: 'XML'
        };
    }
    
    if (['yaml', 'yml'].includes(ext)) {
        return {
            icon: <CogIcon className="w-full h-full" />,
            color: 'text-blue-500',
            label: 'YAML'
        };
    }
    
    if (['toml'].includes(ext)) {
        return {
            icon: <CogIcon className="w-full h-full" />,
            color: 'text-gray-600',
            label: 'TOML'
        };
    }
    
    if (['ini', 'conf', 'config', 'env'].includes(ext)) {
        return {
            icon: <CogIcon className="w-full h-full" />,
            color: 'text-gray-500',
            label: 'CFG'
        };
    }
    
    // Documents
    if (['txt'].includes(ext)) {
        return {
            icon: <DocumentTextIcon className="w-full h-full" />,
            color: 'text-gray-600',
            label: 'TXT'
        };
    }
    
    if (['md', 'markdown'].includes(ext)) {
        return {
            icon: <DocumentTextIcon className="w-full h-full" />,
            color: 'text-blue-600',
            label: 'MD'
        };
    }
    
    if (['pdf'].includes(ext)) {
        return {
            icon: <DocumentTextIcon className="w-full h-full" />,
            color: 'text-red-600',
            label: 'PDF'
        };
    }
    
    if (['doc', 'docx'].includes(ext)) {
        return {
            icon: <DocumentTextIcon className="w-full h-full" />,
            color: 'text-blue-700',
            label: 'DOC'
        };
    }
    
    if (['rtf'].includes(ext)) {
        return {
            icon: <DocumentTextIcon className="w-full h-full" />,
            color: 'text-blue-500',
            label: 'RTF'
        };
    }
    
    // Spreadsheets
    if (['csv'].includes(ext)) {
        return {
            icon: <TableCellsIcon className="w-full h-full" />,
            color: 'text-green-600',
            label: 'CSV'
        };
    }
    
    if (['xls', 'xlsx'].includes(ext)) {
        return {
            icon: <TableCellsIcon className="w-full h-full" />,
            color: 'text-green-700',
            label: 'XLS'
        };
    }
    
    // Presentations
    if (['ppt', 'pptx'].includes(ext)) {
        return {
            icon: <PresentationChartBarIcon className="w-full h-full" />,
            color: 'text-orange-600',
            label: 'PPT'
        };
    }
    
    // Database
    if (['sql', 'db', 'sqlite', 'sqlite3'].includes(ext)) {
        return {
            icon: <CircleStackIcon className="w-full h-full" />,
            color: 'text-cyan-600',
            label: ext.toUpperCase()
        };
    }
    
    // Log files
    if (['log'].includes(ext)) {
        return {
            icon: <DocumentChartBarIcon className="w-full h-full" />,
            color: 'text-gray-500',
            label: 'LOG'
        };
    }
    
    // Default
    return {
        icon: <DocumentIcon className="w-full h-full" />,
        color: 'text-zinc-500',
        label: ext.toUpperCase() || 'FILE'
    };
};

// Grid view component - shows icon with extension badge
export const FileIconWithBadge: React.FC<{
    contentType: string;
    fileName: string;
    size?: 'sm' | 'md' | 'lg';
}> = ({ contentType, fileName, size = 'md' }) => {
    const config = getFileTypeConfig(contentType, fileName);
    
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };
    
    const badgeSizeClasses = {
        sm: 'text-[8px] px-1',
        md: 'text-[10px] px-1.5',
        lg: 'text-xs px-2'
    };
    
    return (
        <div className="relative inline-block">
            <div className={`${sizeClasses[size]} ${config.color}`}>
                {config.icon}
            </div>
            <div className={`absolute -bottom-1 -right-1 bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-800 rounded ${badgeSizeClasses[size]} font-mono font-bold leading-tight`}>
                {config.label}
            </div>
        </div>
    );
};

// Simple icon for list view
export const FileIcon: React.FC<{
    contentType: string;
    fileName: string;
    size?: 'sm' | 'md' | 'lg';
}> = ({ contentType, fileName, size = 'md' }) => {
    const config = getFileTypeConfig(contentType, fileName);
    
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };
    
    return (
        <div className={`${sizeClasses[size]} ${config.color} flex-shrink-0`}>
            {config.icon}
        </div>
    );
};