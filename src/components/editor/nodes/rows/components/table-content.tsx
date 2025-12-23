import React from 'react';
import {BoltIcon, TableCellsIcon} from '@heroicons/react/24/outline';

interface TableContentProps {
    logic?: {
        displayName?: string;
        textColor: string;
        iconColor: string;
        isValueConnected: boolean;
        valueText: string;
        categorySubTextColor?: string;
    };
}

const TableContent: React.FC<TableContentProps> = ({ logic }) => {
    if (!logic) return null;

    // Parse table info from valueText if it's JSON
    let tableInfo = '';
    try {
        if (logic.valueText && !logic.isValueConnected) {
            const parsed = JSON.parse(logic.valueText);
            if (parsed.columns && parsed.rows) {
                const colCount = parsed.columns.length;
                const rowCount = parsed.rows.length;
                tableInfo = `${colCount} col${colCount !== 1 ? 's' : ''}, ${rowCount} row${rowCount !== 1 ? 's' : ''}`;
            }
        }
    } catch {
        tableInfo = '';
    }

    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName || 'Unknown'}:
            </h3>
            <TableCellsIcon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            {logic.isValueConnected ? (
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            ) : (
                <span className={`ml-1 truncate ${logic.categorySubTextColor}`}>
                    {tableInfo || 'empty'}
                </span>
            )}
        </>
    );
};

export default TableContent;
