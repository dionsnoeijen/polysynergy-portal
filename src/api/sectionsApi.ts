import {Section, SectionLayoutConfig} from "@/types/types";
import {getIdToken} from "@/api/auth/authToken";
import config from "@/config";

export const fetchSections = async (projectId: string): Promise<Section[]> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/sections/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch sections: ${response.statusText}`);
    }

    return response.json();
};

export const fetchSection = async (
    sectionId: string,
    projectId: string
): Promise<Section> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/sections/${sectionId}/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch section: ${response.statusText}`);
    }

    return response.json();
};

export const createSection = async (
    projectId: string,
    section: Omit<Section, 'id'>
): Promise<Section> => {
    const idToken = getIdToken();

    // Prepare payload with required fields
    const payload = {
        ...section,
        table_name: section.handle,  // table_name must equal handle
        project_id: projectId,        // required from context
    };

    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/sections/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(payload),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to create section: ${response.statusText}`);
    }

    return response.json();
};

export const updateSection = async (
    sectionId: string,
    projectId: string,
    section: Partial<Section>
): Promise<Section> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/sections/${sectionId}/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(section),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to update section: ${response.statusText}`);
    }

    return response.json();
};

export const updateSectionLayout = async (
    sectionId: string,
    projectId: string,
    layout: SectionLayoutConfig
): Promise<Section> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/sections/${sectionId}/layout/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(layout),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to update section layout: ${response.statusText}`);
    }

    return response.json();
};

export const updateTableColumnOrder = async (
    sectionId: string,
    projectId: string,
    order: string[],
    hidden: string[] = [],
    widths: Record<string, number> = {}
): Promise<Section> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/sections/${sectionId}/?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                layout_config: {
                    table_columns: {
                        order,
                        hidden,
                        widths,
                    },
                },
            }),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to update table column order: ${response.statusText}`);
    }

    return response.json();
};

export const deleteSection = async (
    sectionId: string,
    projectId: string
): Promise<void> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/sections/${sectionId}/?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete section: ${response.statusText}`);
    }
};

// Section Content/Records API

export interface TableColumn {
    field_handle: string;
    label: string;
    type: string;
    sortable: boolean;
    width: number; // Percentage (0-100)
    sort_order?: number;
    cell_config: {
        component: string;
        props: Record<string, unknown>;
    };
}

export interface FormField {
    field_handle: string;
    label: string;
    type: string;
    required: boolean;
    is_visible: boolean;
    col_start: number;  // 1-12 (inclusive)
    col_end: number;    // 2-13 (exclusive)
    sort_order: number;
    form_input_config: {
        component: string;
        props: Record<string, unknown>;
    };
}

export interface FormTab {
    name: string;
    label: string;
    sort_order: number;
    fields: FormField[];
}

export interface FormConfig {
    section: {
        id: string;
        handle: string;
        label: string;
        icon?: string;
        description?: string;
    };
    tabs: FormTab[];
}

export interface TableConfig {
    section: {
        id: string;
        handle: string;
        label: string;
        icon?: string;
        description?: string;
        migration_status?: string;
    };
    columns: TableColumn[];
    default_sort: {
        field: string;
        direction: 'ASC' | 'DESC';
    };
}

export interface SectionRecordsResponse {
    records: Record<string, unknown>[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
}

export interface FetchRecordsParams {
    limit?: number;
    offset?: number;
    order_by?: string;
    order_direction?: 'ASC' | 'DESC';
    search?: string;
}

export const fetchFormConfig = async (
    sectionId: string,
    projectId: string
): Promise<FormConfig> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/content/${sectionId}/form-config/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch form config: ${response.statusText}`);
    }

    return response.json();
};

export const fetchTableConfig = async (
    sectionId: string,
    projectId: string
): Promise<TableConfig> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/content/${sectionId}/table-config/?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch table config: ${response.statusText}`);
    }

    return response.json();
};

export const fetchSectionRecords = async (
    sectionId: string,
    projectId: string,
    params: FetchRecordsParams = {}
): Promise<SectionRecordsResponse> => {
    const idToken = getIdToken();

    const queryParams = new URLSearchParams({
        project_id: projectId,
        limit: (params.limit || 50).toString(),
        offset: (params.offset || 0).toString(),
    });

    if (params.order_by) {
        queryParams.append('order_by', params.order_by);
    }
    if (params.order_direction) {
        queryParams.append('order_direction', params.order_direction);
    }
    if (params.search) {
        queryParams.append('search', params.search);
    }

    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/content/${sectionId}/records/?${queryParams}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch section records: ${response.statusText}`);
    }

    return response.json();
};

export const fetchSingleRecord = async (
    sectionId: string,
    recordId: string,
    projectId: string
): Promise<Record<string, unknown>> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/content/${sectionId}/records/${recordId}?project_id=${projectId}`,
        {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch record: ${response.statusText}`);
    }

    return response.json();
};

export const createSectionRecord = async (
    sectionId: string,
    projectId: string,
    data: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/content/${sectionId}/records/?project_id=${projectId}`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create section record: ${response.statusText}. ${errorText}`);
    }

    return response.json();
};

export const updateSectionRecord = async (
    sectionId: string,
    recordId: string,
    projectId: string,
    data: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/content/${sectionId}/records/${recordId}?project_id=${projectId}`,
        {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update section record: ${response.statusText}. ${errorText}`);
    }

    return response.json();
};

export const deleteSectionRecord = async (
    sectionId: string,
    recordId: string,
    projectId: string
): Promise<void> => {
    const idToken = getIdToken();
    const response = await fetch(
        `${config.LOCAL_API_URL}/section-field/content/${sectionId}/records/${recordId}?project_id=${projectId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete section record: ${response.statusText}`);
    }
};
