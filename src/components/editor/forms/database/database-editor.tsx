import React, {useEffect, useState} from 'react';
import {Button} from "@/components/button";
import {Text} from "@/components/text";
import {Subheading} from "@/components/heading";
import useDatabaseConnectionsStore from "@/stores/databaseConnectionsStore";
import DatabaseConnectionForm from "@/components/editor/forms/database/database-connection-form";
import DatabaseConnectionsList from "@/components/editor/forms/database/database-connections-list";

const DatabaseEditor: React.FC = () => {
    const connections = useDatabaseConnectionsStore((state) => state.connections);
    const fetchDatabaseConnections = useDatabaseConnectionsStore((state) => state.fetchDatabaseConnections);
    const [showForm, setShowForm] = useState(false);
    const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
    const [selectedStorage, setSelectedStorage] = useState<'internal' | 'external'>('internal');

    useEffect(() => {
        fetchDatabaseConnections();
    }, [fetchDatabaseConnections]);

    useEffect(() => {
        if (connections.length > 0) {
            setSelectedStorage('external');
        }
    }, [connections]);

    const handleEdit = (connectionId: string) => {
        setEditingConnectionId(connectionId);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingConnectionId(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <Subheading>Where should section data be stored?</Subheading>
                <div className="mt-4 space-y-3">
                    <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedStorage === 'internal'
                            ? 'border-sky-500 dark:border-white bg-sky-50 dark:bg-white/5'
                            : 'border-gray-300 dark:border-white/20 hover:border-sky-400 dark:hover:border-white/40'
                    }`}>
                        <input
                            type="radio"
                            value="internal"
                            checked={selectedStorage === 'internal'}
                            onChange={() => setSelectedStorage('internal')}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <div className="font-medium text-sm">Internal PolySynergy Database</div>
                            <Text className="text-xs mt-1">
                                Data is stored in the main PolySynergy database (recommended for most cases)
                            </Text>
                        </div>
                    </label>

                    <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                        selectedStorage === 'external'
                            ? 'border-sky-500 dark:border-white bg-sky-50 dark:bg-white/5'
                            : 'border-gray-300 dark:border-white/20 hover:border-sky-400 dark:hover:border-white/40'
                    }`}>
                        <input
                            type="radio"
                            value="external"
                            checked={selectedStorage === 'external'}
                            onChange={() => setSelectedStorage('external')}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <div className="font-medium text-sm">External Database</div>
                            <Text className="text-xs mt-1">
                                Configure a custom PostgreSQL, MySQL, or SQLite database
                            </Text>
                        </div>
                    </label>
                </div>
            </div>

            {selectedStorage === 'external' && (
                <div>
                    {!showForm && connections.length > 0 && (
                        <>
                            <DatabaseConnectionsList
                                connections={connections}
                                onEdit={handleEdit}
                            />
                            <Button
                                onClick={() => setShowForm(true)}
                                color="dark/white"
                                className="mt-4"
                            >
                                Add Database Connection
                            </Button>
                        </>
                    )}

                    {!showForm && connections.length === 0 && (
                        <div className="text-center py-8">
                            <Text className="mb-4">No database connections configured</Text>
                            <Button onClick={() => setShowForm(true)} color="dark/white">
                                Add Database Connection
                            </Button>
                        </div>
                    )}

                    {showForm && (
                        <DatabaseConnectionForm
                            connectionId={editingConnectionId}
                            onClose={handleFormClose}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default DatabaseEditor;
