import {DatabaseConnection, DatabaseConnectionTestResult} from "@/types/types";
import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const fetchDatabaseConnections = async (projectId: string): Promise<DatabaseConnection[]> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/database-connections/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch database connections: ${response.statusText}`);
    }

    return response.json();
};

export const fetchDatabaseConnection = async (
    connectionId: string,
    projectId: string
): Promise<DatabaseConnection> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/database-connections/${connectionId}/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch database connection: ${response.statusText}`);
    }

    return response.json();
};

export const createDatabaseConnection = async (
    projectId: string,
    connection: Omit<DatabaseConnection, 'id'>
): Promise<DatabaseConnection> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/database-connections/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(connection),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to create database connection: ${response.statusText}`);
    }

    return response.json();
};

export const updateDatabaseConnection = async (
    connectionId: string,
    projectId: string,
    connection: Partial<DatabaseConnection>
): Promise<DatabaseConnection> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/database-connections/${connectionId}/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(connection),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to update database connection: ${response.statusText}`);
    }

    return response.json();
};

export const deleteDatabaseConnection = async (
    connectionId: string,
    projectId: string
): Promise<void> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/database-connections/${connectionId}/?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete database connection: ${response.statusText}`);
    }
};

export const testDatabaseConnection = async (
    connectionId: string,
    projectId: string
): Promise<DatabaseConnectionTestResult> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/database-connections/${connectionId}/test/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to test database connection: ${response.statusText}`);
    }

    return response.json();
};
