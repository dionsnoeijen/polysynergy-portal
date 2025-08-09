import React, { memo } from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

type BreadcrumbProps = {
    currentPath: string;
    onNavigate: (path: string) => void;
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentPath, onNavigate }) => {
    const pathSegments = currentPath ? currentPath.split('/').filter(Boolean) : [];

    const handleRootClick = () => {
        onNavigate('');
    };

    const handleSegmentClick = (index: number) => {
        const newPath = pathSegments.slice(0, index + 1).join('/');
        onNavigate(newPath);
    };

    return (
        <nav className="flex items-center space-x-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900">
            <button
                onClick={handleRootClick}
                className={`
                    flex items-center px-2 py-1 rounded text-sm transition-colors duration-150
                    ${currentPath === '' 
                        ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300' 
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }
                `}
                title="Root directory"
            >
                <HomeIcon className="w-4 h-4" />
                <span className="ml-1">Root</span>
            </button>

            {pathSegments.map((segment, index) => (
                <React.Fragment key={index}>
                    <ChevronRightIcon className="w-3 h-3 text-zinc-400" />
                    <button
                        onClick={() => handleSegmentClick(index)}
                        className={`
                            px-2 py-1 rounded text-sm transition-colors duration-150
                            ${index === pathSegments.length - 1
                                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                                : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                            }
                        `}
                        title={`Navigate to ${pathSegments.slice(0, index + 1).join('/')}`}
                    >
                        {segment}
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );
};

export default memo(Breadcrumb);