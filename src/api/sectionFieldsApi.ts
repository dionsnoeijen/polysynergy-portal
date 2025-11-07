import {SectionField} from "@/types/types";
import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const fetchSectionFields = async (
    projectId: string
): Promise<SectionField[]> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/fields/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch section fields: ${response.statusText}`);
    }

    return response.json();
};

export const fetchSectionField = async (
    fieldId: string,
    projectId: string
): Promise<SectionField> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/fields/${fieldId}/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch section field: ${response.statusText}`);
    }

    return response.json();
};

export const createSectionField = async (
    projectId: string,
    field: Omit<SectionField, 'id'>
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/fields/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(field),
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "An error occurred while creating the section field.");
    }

    return response.json();
};

export const updateSectionField = async (
    fieldId: string,
    projectId: string,
    updatedData: Partial<SectionField>
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/fields/${fieldId}/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(updatedData),
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "An error occurred while updating the section field.");
    }

    return response.json();
};

export const deleteSectionField = async (
    fieldId: string,
    projectId: string
) => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/fields/${fieldId}/?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete section field: ${response.statusText}`);
    }

    return response;
};
