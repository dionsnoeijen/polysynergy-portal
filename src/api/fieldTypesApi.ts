import {FieldType} from "@/types/types";
import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const fetchFieldTypes = async (projectId: string): Promise<FieldType[]> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/field-types/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch field types: ${response.statusText}`);
    }

    return response.json();
};

export const fetchFieldType = async (
    handle: string,
    projectId: string
): Promise<FieldType> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/field-types/${handle}/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch field type: ${response.statusText}`);
    }

    return response.json();
};
