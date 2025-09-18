import React from 'react';
import {shortenFileName} from '@/utils/shortenFileName';

interface FileListProps {
    logic?: {
        shouldShowFileList: boolean;
        fileList: string[];
        variable: {
            handle: string;
        };
        categorySubTextColor?: string;
        categoryMainTextColor?: string;
        textColor?: string;
    };
}

const FileList: React.FC<FileListProps> = ({ logic }) => {
    if (!logic?.shouldShowFileList) {
        return null;
    }

    return (
        <>
            {logic.fileList.map((item, index) => {
                return (
                    <div key={'list-' + index} className="flex items-center pl-6 pr-6 pt-1 relative">
                        <div className="flex items-center truncate" title={`${logic.variable.handle}.${item}`}>
                            <span className={logic.categorySubTextColor}>
                                {index === logic.fileList.length - 1 ? (
                                    <div className={"w-4 h-4"}>
                                        <div className={`w-2 h-2 border-l border-b border-dotted ${logic.textColor?.replace('text-', 'border-') || logic.categoryMainTextColor?.replace('text-', 'border-') || 'border-sky-600'}`}></div>
                                    </div>
                                ) : (
                                    <div className={"w-4 h-4"}>
                                        <div className={`w-2 h-2 border-l border-b border-dotted ${logic.textColor?.replace('text-', 'border-') || logic.categoryMainTextColor?.replace('text-', 'border-') || 'border-sky-600'}`}></div>
                                        <div className={`w-2 h-2 border-l border-dotted ${logic.textColor?.replace('text-', 'border-') || logic.categoryMainTextColor?.replace('text-', 'border-') || 'border-sky-600'}`}></div>
                                    </div>
                                )}
                            </span>
                            <span className={logic.textColor || logic.categoryMainTextColor || 'text-sky-600 dark:text-white'}>filename: {shortenFileName(item as string)}</span>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default FileList;