import React from "react";

type Props = React.PropsWithChildren<{
  title: string;
  version?: number;
}>;

const VariableGroup: React.FC<Props> = ({ title, version, children }) => {
  const formattedVersion = version != null ? `v${version.toFixed(1)}` : null;

  return (
    <div className="border border-sky-500 dark:border-white/20 rounded-md dark:bg-zinc-800 shadow-sm">
      <div className="flex justify-between items-center border-b border-sky-500 dark:border-white/20 p-2">
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {formattedVersion && (
            <span className="text-xs px-2 py-0.5 bg-sky-100 dark:bg-white/10 rounded text-sky-800 dark:text-white/70">
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