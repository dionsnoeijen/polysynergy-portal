import { Route } from "@/types/types";
import {getIdToken} from "@/api/auth/authToken";

export const fetchDynamicRoutes = async (projectId: string): Promise<Route[]> => {
    const idToken = getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/dynamic-routes/?project_id=${projectId}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });
    return response.json();
};

export const fetchDynamicRoute = async (routeId: string): Promise<Route> => {
    const idToken = getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/dynamic-routes/${routeId}/`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });
    return response.json();
}

export const storeDynamicRoute = async (projectId: string, route: Route) => {
    const idToken = getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/dynamic-routes/`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            ...route,
            project_id: projectId,
        }),
    });
    return response.json();
};

export const updateDynamicRoute = async (projectId: string, routeId: string, updatedData: Partial<Route>) => {
    const idToken = getIdToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/dynamic-routes/${routeId}/`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
            ...updatedData,
            project_id: projectId
        }),
    });
    return response.json();
};

export const deleteDynamicRoute = async (routeId: string) => {
    const idToken = getIdToken();
    return await fetch(`${process.env.NEXT_PUBLIC_POLYSYNERGY_API}/dynamic-routes/${routeId}/`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });
};