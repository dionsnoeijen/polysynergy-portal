import React from 'react';

export interface NameParts {
    baseName: string;
    extension: string;
}

export const parseFileName = (fileName: string): NameParts => {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
        return { baseName: fileName, extension: '' };
    }
    
    return {
        baseName: fileName.substring(0, lastDotIndex),
        extension: fileName.substring(lastDotIndex + 1)
    };
};

// Component that highlights the file extension
export const FileNameWithExtension: React.FC<{
    fileName: string;
    className?: string;
    maxLength?: number;
}> = ({ fileName, className = '', maxLength }) => {
    const { baseName, extension } = parseFileName(fileName);
    
    // If we have a max length, we need to intelligently truncate
    let displayBaseName = baseName;
    let displayExtension = extension;
    
    if (maxLength && fileName.length > maxLength) {
        if (extension.length < maxLength / 3) {
            // Keep full extension, truncate basename
            const maxBaseLength = maxLength - extension.length - 1; // -1 for the dot
            displayBaseName = baseName.length > maxBaseLength 
                ? baseName.substring(0, maxBaseLength - 3) + '...'
                : baseName;
        } else {
            // Both are too long, truncate both but prioritize extension visibility
            const maxExtLength = Math.floor(maxLength / 3);
            const maxBaseLength = maxLength - maxExtLength - 4; // -4 for "..." and "."
            
            displayBaseName = baseName.length > maxBaseLength 
                ? baseName.substring(0, maxBaseLength) + '...'
                : baseName;
            displayExtension = extension.length > maxExtLength
                ? extension.substring(0, maxExtLength)
                : extension;
        }
    }
    
    if (!extension) {
        return <span className={className} title={fileName}>{displayBaseName}</span>;
    }
    
    return (
        <span className={className} title={fileName}>
            <span className="text-zinc-900 dark:text-zinc-100">{displayBaseName}</span>
            <span className="text-zinc-500 dark:text-zinc-400">.</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{displayExtension}</span>
        </span>
    );
};

// Simpler version for grid view where space is very limited
export const FileNameGridView: React.FC<{
    fileName: string;
    className?: string;
}> = ({ fileName, className = '' }) => {
    const { baseName, extension } = parseFileName(fileName);
    
    if (!extension) {
        return <span className={className} title={fileName}>{fileName}</span>;
    }
    
    return (
        <div className={className} title={fileName}>
            <div className="truncate">{baseName}</div>
            {extension && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                    .{extension.toUpperCase()}
                </div>
            )}
        </div>
    );
};