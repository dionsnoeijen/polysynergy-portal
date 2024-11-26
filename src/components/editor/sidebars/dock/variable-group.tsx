import React from "react";

type Props = React.PropsWithChildren<{
    title: string;
}>;

const VariableGroup: React.FC<Props> = ({ title, children }): React.ReactElement => {
    return <div className="border border-sky-500 dark:border-white/20 rounded-md">
        <div className="flex justify-between items-center border-b border-sky-500 dark:border-white/20 p-2">
            <div>{title}</div>
        </div>
        <div className="p-2 flex flex-col gap-2">
            {children}
        </div>
    </div>
};

export default VariableGroup;
