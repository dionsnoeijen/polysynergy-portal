import {Route} from "@/types/types";
import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const fetchDynamicRoutes = async (projectId: string): Promise<Route[]> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/routes/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );
    return response.json();
};

export const fetchDynamicRoute = async (
    routeId: string,
    projectId: string
): Promise<Route> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/routes/${routeId}/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });
    return response.json();
}

export const storeDynamicRoute = async (
    projectId: string,
    route: Route
) => {
    const idToken = getIdToken();
    const response = await fetch(
        // `${config.API_URL}/dynamic-routes/`,
        `${config.LOCAL_API_URL}/routes/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                ...route
            }),
        });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "An error occurred while storing the route.");
    }

    return response.json();
};

export const updateDynamicRoute = async (
    projectId: string,
    routeId: string,
    activeVersionId: string,
    updatedData: Partial<Route>
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/routes/${routeId}/versions/${activeVersionId}/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(updatedData),
        });
    return response.json();
};

export const deleteDynamicRoute = async (
    routeId: string,
    projectId: string
) => {
    const idToken = getIdToken();
    return await fetch(
        `${config.LOCAL_API_URL}/routes/${routeId}/?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );
};