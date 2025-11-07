import {FieldAssignment} from "@/types/types";
import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const fetchAssignmentsBySection = async (
    sectionId: string,
    projectId: string
): Promise<FieldAssignment[]> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/assignments/section/${sectionId}/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch field assignments: ${response.statusText}`);
    }

    return response.json();
};

export const createAssignmentsBulk = async (
    projectId: string,
    assignments: Omit<FieldAssignment, 'id'>[]
): Promise<{assignments: FieldAssignment[]}> => {
    const idToken = getIdToken();

    console.log('🔵 Bulk create request:', {
        url: `${config.LOCAL_API_URL}/section-field/assignments/bulk/?project_id=${projectId}`,
        count: assignments.length,
        assignments
    });

    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/assignments/bulk/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({assignments}),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 Bulk create failed:', response.status, errorText);
        throw new Error(`Failed to create field assignments: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('🟢 Bulk create response:', result);
    return result;
};

export const updateAssignment = async (
    assignmentId: string,
    projectId: string,
    assignment: Partial<FieldAssignment>
): Promise<FieldAssignment> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/assignments/${assignmentId}/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(assignment),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to update field assignment: ${response.statusText}`);
    }

    return response.json();
};

export const deleteAssignment = async (
    assignmentId: string,
    projectId: string
): Promise<void> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/assignments/${assignmentId}/?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete field assignment: ${response.statusText}`);
    }
};
