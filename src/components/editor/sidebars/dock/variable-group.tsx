import React from "react";

type Props = React.PropsWithChildren<{
    title: string;
    version?: number;
    categoryBorderColor?: string;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBackgroundColor?: string;
    categoryGradientBackgroundColor?: string;
    isService?: boolean;
}>;

const VariableGroup: React.FC<Props> = ({
                                            title,
                                            version,
                                            children,
                                            categoryMainTextColor = 'text-sky-500 dark:text-white/70',
                                            categorySubTextColor = 'text-sky-800 dark:text-white/70',
                                            categoryBorderColor = 'border-sky-500 dark:border-white/20',
                                            categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
                                            categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900',
                                            isService = false
                                        }) => {
    const formattedVersion = version != null ? `v${version.toFixed(1)}` : null;

    return (
        <div className={`border ${categoryBorderColor} ${categoryBackgroundColor} rounded-md shadow-sm relative`}>
            {isService && (
                <div className={`absolute inset-0 bg-white/40 dark:bg-black/40 rounded-md z-10`}>
                </div>
            )}
            <div
                className={`flex justify-between items-center border-b ${categoryBorderColor} ${categoryGradientBackgroundColor} p-2`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`${categoryMainTextColor} truncate`}>{title}</span>
                    {formattedVersion && (
                    <span
                        className={`text-xs px-2 py-0.5 ${categoryBackgroundColor} rounded ${categorySubTextColor}`}>
                        {formattedVersion}
                    </span>
                    )}
                </div>
            </div>
            <div className="p-2 flex flex-col gap-2">{children}</div>
        </div>
    );
};

export default VariableGroup;