import React, {useState} from 'react';
import {Button} from "@/components/button";
import {Text} from "@/components/text";
import {Alert, AlertActions, AlertDescription, AlertTitle} from '@/components/alert';
import {PencilIcon, TrashIcon} from "@heroicons/react/24/outline";
import useDatabaseConnectionsStore from "@/stores/databaseConnectionsStore";
import {DatabaseConnection} from "@/types/types";

interface DatabaseConnectionsListProps {
    connections: DatabaseConnection[];
    onEdit: (connectionId: string) => void;
}

const DatabaseConnectionsList: React.FC<DatabaseConnectionsListProps> = ({connections, onEdit}) => {
    const deleteDatabaseConnection = useDatabaseConnectionsStore((state) => state.deleteDatabaseConnection);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [deletingConnectionId, setDeletingConnectionId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleDeleteClick = (connectionId: string) => {
        setDeletingConnectionId(connectionId);
        setShowDeleteAlert(true);
    };

    const handleDelete = async () => {
        if (!deletingConnectionId) return;

        try {
            await deleteDatabaseConnection(deletingConnectionId);
            setShowDeleteAlert(false);
            setDeletingConnectionId(null);
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage((error as Error).message);
        }
    };

    return (
        <>
            <div className="space-y-3">
                {connections.map((connection) => (
                    <div
                        key={connection.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-white/20"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{connection.label}</span>
                                <span className="text-xs px-2 py-0.5 bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded">
                                    {connection.database_type.toUpperCase()}
                                </span>
                            </div>
                            <Text className="text-xs mt-1">
                                {connection.handle}
                                {connection.description && ` • ${connection.description}`}
                            </Text>
                            {connection.database_type !== 'sqlite' && (
                                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {connection.host}:{connection.port} / {connection.database_name}
                                </Text>
                            )}
                            {connection.database_type === 'sqlite' && (
                                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {connection.file_path}
                                </Text>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onEdit(connection.id)}
                                type="button"
                                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-white/10"
                                title="Edit connection"
                            >
                                <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDeleteClick(connection.id)}
                                type="button"
                                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-white/10"
                                title="Delete connection"
                            >
                                <TrashIcon className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {errorMessage && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mt-4">
                    <Text className="text-sm text-red-800 dark:text-red-200">
                        {errorMessage}
                    </Text>
                </div>
            )}

            <Alert open={showDeleteAlert} onClose={() => setShowDeleteAlert(false)}>
                <AlertTitle>Delete Database Connection?</AlertTitle>
                <AlertDescription>
                    Are you sure you want to delete this database connection? This action cannot be undone.
                    Sections using this connection will need to be reconfigured.
                </AlertDescription>
                <AlertActions>
                    <Button plain onClick={() => setShowDeleteAlert(false)}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDelete}>
                        Delete
                    </Button>
                </AlertActions>
            </Alert>
        </>
    );
};

export default DatabaseConnectionsList;
