import { getIdToken } from "@/api/auth/authToken";
import { Package } from "@/types/types";
import config from "@/config";

export const updateService = async (
    id: string,
    name: string,
    category: string,
    description: string,
    packagedData: Package
) => {
    try {
        const idToken = getIdToken();
        const response = await fetch(`${config.API_URL}/services/${id}/`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                name,
                metadata: {
                    category,
                    description
                },
                node_setup_content: {
                    nodes: packagedData.nodes,
                    connections: packagedData.connections
                }
            }),
        });

        return await response.json();
    } catch (error) {
        console.error("Error updating service:", error);
        throw error;
    }
}

export const deleteService = async (id: string) => {
    try {
        const idToken = getIdToken();
        const response = await fetch(`${config.API_URL}/services/${id}/`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to delete service: ${response.status} ${errorMessage}`);
        }
    } catch (error) {
        console.error("Error deleting service:", error);
        throw error;
    }
}

export const storeService = async (
    id: string,
    name: string,
    category: string,
    description: string,
    packagedData: Package
) => {
    try {
        const idToken = getIdToken();
        const response = await fetch(`${config.API_URL}/services/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                id,
                name,
                metadata: {
                    category,
                    description
                },
                node_setup_content: {
                    nodes: packagedData.nodes,
                    connections: packagedData.connections
                }
            }),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to store service: ${response.status} ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error storing service:", error);
        throw error;
    }
};

export const fetchServices = async () => {
    try {
        const idToken = getIdToken();
        const response = await fetch(`${config.API_URL}/services/`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });

        return await response.json();
    } catch (error) {
        console.error("Error fetching services:", error);
        throw error;
    }
};