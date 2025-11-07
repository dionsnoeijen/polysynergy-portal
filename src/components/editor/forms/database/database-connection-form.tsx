import React, {useEffect, useState} from 'react';
import {Button} from "@/components/button";
import {Input} from "@/components/input";
import {Textarea} from "@/components/textarea";
import {Select} from "@/components/select";
import {Checkbox, CheckboxField} from "@/components/checkbox";
import {Text} from "@/components/text";
import {Subheading} from "@/components/heading";
import {Divider} from "@/components/divider";
import useDatabaseConnectionsStore from "@/stores/databaseConnectionsStore";
import {DatabaseConnection} from "@/types/types";

interface DatabaseConnectionFormProps {
    connectionId: string | null;
    onClose: () => void;
}

const DatabaseConnectionForm: React.FC<DatabaseConnectionFormProps> = ({connectionId, onClose}) => {
    const getDatabaseConnection = useDatabaseConnectionsStore((state) => state.getDatabaseConnection);
    const createDatabaseConnection = useDatabaseConnectionsStore((state) => state.createDatabaseConnection);
    const updateDatabaseConnection = useDatabaseConnectionsStore((state) => state.updateDatabaseConnection);
    const testDatabaseConnection = useDatabaseConnectionsStore((state) => state.testDatabaseConnection);

    const [handle, setHandle] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [databaseType, setDatabaseType] = useState<'postgresql' | 'mysql' | 'sqlite'>('postgresql');
    const [host, setHost] = useState('localhost');
    const [port, setPort] = useState<number>(5432);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [filePath, setFilePath] = useState('');
    const [databaseName, setDatabaseName] = useState('');
    const [useSsl, setUseSsl] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (connectionId) {
            const connection = getDatabaseConnection(connectionId);
            if (connection) {
                setHandle(connection.handle);
                setLabel(connection.label);
                setDescription(connection.description || '');
                setDatabaseType(connection.database_type);
                setHost(connection.host || 'localhost');
                setPort(connection.port || 5432);
                setUsername(connection.username || '');
                setPassword(connection.password || '');
                setFilePath(connection.file_path || '');
                setDatabaseName(connection.database_name);
                setUseSsl(connection.use_ssl || false);
            }
        }
    }, [connectionId, getDatabaseConnection]);

    useEffect(() => {
        // Update default port when database type changes
        if (databaseType === 'postgresql') {
            setPort(5432);
        } else if (databaseType === 'mysql') {
            setPort(3306);
        }
    }, [databaseType]);

    const validateHandle = (value: string): boolean => {
        const pattern = /^[a-z][a-z0-9_]*$/;
        return pattern.test(value);
    };

    const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setHandle(value);

        if (value && !validateHandle(value)) {
            setErrorMessage('Handle must start with lowercase letter and contain only lowercase letters, numbers, and underscores');
        } else {
            setErrorMessage(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!validateHandle(handle)) {
            setErrorMessage('Handle must start with lowercase letter and contain only lowercase letters, numbers, and underscores');
            return;
        }

        try {
            const connectionData: Omit<DatabaseConnection, 'id'> = {
                handle,
                label,
                description: description || undefined,
                database_type: databaseType,
                database_name: databaseName,
                use_ssl: useSsl,
                ...(databaseType !== 'sqlite' && {
                    host,
                    port,
                    username,
                    password,
                }),
                ...(databaseType === 'sqlite' && {
                    file_path: filePath,
                }),
            };

            if (connectionId) {
                await updateDatabaseConnection(connectionId, connectionData);
            } else {
                await createDatabaseConnection(connectionData);
            }

            onClose();
        } catch (error) {
            setErrorMessage((error as Error).message);
        }
    };

    const handleTest = async () => {
        if (!connectionId) {
            setTestResult({
                success: false,
                message: 'Please save the connection first before testing'
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const result = await testDatabaseConnection(connectionId);
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                message: (error as Error).message
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Subheading>
                {connectionId ? 'Edit Database Connection' : 'New Database Connection'}
            </Subheading>

            {errorMessage && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <Text className="text-sm text-red-800 dark:text-red-200">
                        {errorMessage}
                    </Text>
                </div>
            )}

            {testResult && (
                <div className={`rounded-md p-4 ${
                    testResult.success
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                    <Text className={`text-sm ${
                        testResult.success
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-red-800 dark:text-red-200'
                    }`}>
                        {testResult.message}
                    </Text>
                </div>
            )}

            <div>
                <label htmlFor="handle" className="block text-sm font-medium mb-1">
                    Handle <span className="text-red-500">*</span>
                </label>
                <Input
                    id="handle"
                    value={handle}
                    onChange={handleHandleChange}
                    placeholder="my_database"
                    required
                    pattern="^[a-z][a-z0-9_]*$"
                />
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Must start with lowercase letter, followed by lowercase letters, numbers, or underscores
                </Text>
            </div>

            <div>
                <label htmlFor="label" className="block text-sm font-medium mb-1">
                    Label <span className="text-red-500">*</span>
                </label>
                <Input
                    id="label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="My Database"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                </label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    rows={2}
                />
            </div>

            <Divider />

            <div>
                <label htmlFor="database_type" className="block text-sm font-medium mb-1">
                    Database Type <span className="text-red-500">*</span>
                </label>
                <Select
                    id="database_type"
                    value={databaseType}
                    onChange={(e) => setDatabaseType(e.target.value as 'postgresql' | 'mysql' | 'sqlite')}
                    required
                >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="sqlite">SQLite</option>
                </Select>
            </div>

            {databaseType !== 'sqlite' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="host" className="block text-sm font-medium mb-1">
                                Host
                            </label>
                            <Input
                                id="host"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                                placeholder="localhost"
                            />
                        </div>
                        <div>
                            <label htmlFor="port" className="block text-sm font-medium mb-1">
                                Port
                            </label>
                            <Input
                                id="port"
                                type="number"
                                value={port}
                                onChange={(e) => setPort(Number(e.target.value))}
                                placeholder="5432"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium mb-1">
                            Username
                        </label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="database_user"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-1">
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                </>
            )}

            {databaseType === 'sqlite' && (
                <div>
                    <label htmlFor="file_path" className="block text-sm font-medium mb-1">
                        File Path
                    </label>
                    <Input
                        id="file_path"
                        value={filePath}
                        onChange={(e) => setFilePath(e.target.value)}
                        placeholder="/data/my_database.db"
                    />
                </div>
            )}

            <div>
                <label htmlFor="database_name" className="block text-sm font-medium mb-1">
                    Database Name <span className="text-red-500">*</span>
                </label>
                <Input
                    id="database_name"
                    value={databaseName}
                    onChange={(e) => setDatabaseName(e.target.value)}
                    placeholder="my_database"
                    required
                />
            </div>

            {databaseType !== 'sqlite' && (
                <CheckboxField>
                    <Checkbox
                        checked={useSsl}
                        onChange={(checked) => setUseSsl(checked)}
                    />
                    <Text>Use SSL/TLS</Text>
                </CheckboxField>
            )}

            <Divider />

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Button type="submit" color="dark/white">
                        {connectionId ? 'Update Connection' : 'Save Connection'}
                    </Button>
                    <Button type="button" plain onClick={onClose}>
                        Cancel
                    </Button>
                </div>
                {connectionId && (
                    <Button
                        type="button"
                        onClick={handleTest}
                        disabled={isTesting}
                    >
                        {isTesting ? 'Testing...' : 'Test Connection'}
                    </Button>
                )}
            </div>
        </form>
    );
};

export default DatabaseConnectionForm;
