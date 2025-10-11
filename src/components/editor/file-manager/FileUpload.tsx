import React, { memo, useRef, useCallback } from 'react';
import { CloudArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type FileUploadProps = {
    onUpload: (files: File[]) => void;
    uploadProgress: Record<string, number>;
    isUploading: boolean;
    dragOver: boolean;
    onDragOver: (dragOver: boolean) => void;
    maxFileSize?: number; // in MB
    acceptedTypes?: string[];
    className?: string;
};

const FileUpload: React.FC<FileUploadProps> = ({
    onUpload,
    uploadProgress,
    isUploading,
    dragOver,
    onDragOver,
    maxFileSize = 100, // 100MB default
    acceptedTypes,
    className = ""
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounterRef = useRef(0);

    // Removed unused formatFileSize function

    const validateFile = useCallback((file: File): string | null => {
        // Check file size
        const maxBytes = maxFileSize * 1024 * 1024;
        if (file.size > maxBytes) {
            return `File size exceeds ${maxFileSize}MB limit`;
        }

        // Check file type if specified
        if (acceptedTypes && acceptedTypes.length > 0) {
            const fileType = file.type;
            const fileExt = file.name.split('.').pop()?.toLowerCase();

            const isValidType = acceptedTypes.some(type => {
                if (type.includes('/')) {
                    // MIME type check
                    return fileType.includes(type) || fileType === type;
                } else {
                    // Extension check
                    return fileExt === type.toLowerCase();
                }
            });

            if (!isValidType) {
                return `File type not allowed. Accepted types: ${acceptedTypes.join(', ')}`;
            }
        }

        return null;
    }, [maxFileSize, acceptedTypes]);

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const validFiles: File[] = [];
        const errors: string[] = [];

        fileArray.forEach(file => {
            const error = validateFile(file);
            if (error) {
                errors.push(`${file.name}: ${error}`);
            } else {
                validFiles.push(file);
            }
        });

        if (errors.length > 0) {
            alert(`Some files were rejected:\n${errors.join('\n')}`);
        }

        if (validFiles.length > 0) {
            onUpload(validFiles);
        }
    }, [onUpload, validateFile]);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        dragCounterRef.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            onDragOver(true);
        }
    }, [onDragOver]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        dragCounterRef.current--;
        if (dragCounterRef.current <= 0) {
            dragCounterRef.current = 0;
            onDragOver(false);
        }
    }, [onDragOver]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        dragCounterRef.current = 0;
        onDragOver(false);
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    }, [onDragOver, handleFiles]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        // Reset input value to allow selecting same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [handleFiles]);

    const handleClick = useCallback(() => {
        if (!isUploading && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [isUploading]);

    const uploadProgressEntries = Object.entries(uploadProgress);
    const hasUploads = uploadProgressEntries.length > 0;

    return (
        <div className={`relative ${className}`}>
            {/* Drop zone */}
            <div
                className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-all duration-200 ease-in-out
                    ${dragOver 
                        ? 'border-sky-400 bg-sky-50 dark:bg-sky-950 scale-105' 
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950'
                    }
                    ${isUploading ? 'pointer-events-none opacity-50' : ''}
                `}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={acceptedTypes?.join(',')}
                    onChange={handleFileInputChange}
                    className="hidden"
                />
                
                <CloudArrowUpIcon className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-sky-500' : 'text-zinc-400'}`} />
                
                <div className="space-y-2">
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                        {dragOver ? 'Drop files here' : 'Upload files'}
                    </h3>
                    
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {dragOver 
                            ? 'Release to upload files' 
                            : 'Drag and drop files here, or click to browse'
                        }
                    </p>
                    
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
                        <p>Maximum file size: {maxFileSize}MB</p>
                        {acceptedTypes && acceptedTypes.length > 0 && (
                            <p>Accepted types: {acceptedTypes.join(', ')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload progress */}
            {hasUploads && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Upload Progress
                    </h4>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {uploadProgressEntries.map(([fileName, progress]) => (
                            <div key={fileName} className="flex items-center space-x-3 p-2 bg-zinc-50 dark:bg-zinc-800 rounded">
                                {/* Status icon */}
                                <div className="flex-shrink-0">
                                    {progress === 100 ? (
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    ) : progress === -1 ? (
                                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                                    ) : (
                                        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                    )}
                                </div>
                                
                                {/* File name */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                        {fileName}
                                    </p>
                                    
                                    {/* Progress bar */}
                                    {progress >= 0 && progress < 100 && (
                                        <div className="mt-1 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                                            <div 
                                                className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Status text */}
                                <div className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                                    {progress === 100 ? 'Complete' : 
                                     progress === -1 ? 'Failed' : 
                                     `${Math.round(progress)}%`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(FileUpload);