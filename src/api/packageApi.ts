import { getIdToken } from "@/api/auth/authToken";
import config from "@/config";

// Types matching backend schemas
export type ItemType = "blueprint" | "service";

export interface ExportItem {
    item_type: ItemType;
    item_id: string;
}

export interface ExportRequest {
    items: ExportItem[];
    export_name?: string;
}

export interface ImportItemDetails {
    item_type: ItemType;
    name: string;
    version_number?: number;
    executable_hash?: string;
    metadata: Record<string, unknown>;
    has_executable: boolean;
}

export interface ImportItemConflict {
    item_type: ItemType;
    item_name: string;
    conflict_type: "name_exists" | "hash_mismatch" | "exact_duplicate";
    existing_id: string;
    existing_name: string;
    existing_created_at: string;
    suggested_names: string[];
    description: string;
}

export interface ImportPreviewResponse {
    export_info: Record<string, unknown>;
    items: ImportItemDetails[];
    conflicts: ImportItemConflict[];
    can_proceed: boolean;
    warnings: string[];
    file_content_b64: string;
}

export interface ImportItemResolution {
    item_type: ItemType;
    item_name: string;
    resolution: "overwrite" | "rename" | "skip";
    new_name?: string;
}

export interface ImportConfirmRequest {
    resolutions: ImportItemResolution[];
    file_content: string;
    import_details: ImportItemDetails[];
}

export interface ImportItemResult {
    item_type: ItemType;
    original_name: string;
    final_name: string;
    entity_id: string;
    status: "created" | "updated" | "skipped" | "failed";
    message: string;
}

export interface ImportResult {
    success: boolean;
    message: string;
    items: ImportItemResult[];
    total_processed: number;
    total_successful: number;
    total_skipped: number;
    total_failed: number;
}

/**
 * Export selected blueprints and services as a .psy file
 */
export const exportPackage = async (
    projectId: string,
    request: ExportRequest
): Promise<Blob> => {
    try {
        const idToken = getIdToken();
        const response = await fetch(
            `${config.LOCAL_API_URL}/export/?project_id=${projectId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to export package: ${response.status} ${errorMessage}`);
        }

        return await response.blob();
    } catch (error) {
        console.error("Error exporting package:", error);
        throw error;
    }
};

/**
 * Preview import of a .psy file and detect conflicts
 */
export const previewImport = async (
    projectId: string,
    file: File
): Promise<ImportPreviewResponse> => {
    try {
        const idToken = getIdToken();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
            `${config.LOCAL_API_URL}/import/preview/?project_id=${projectId}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to preview import: ${response.status} ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error previewing import:", error);
        throw error;
    }
};

/**
 * Confirm and execute import with conflict resolutions
 */
export const confirmImport = async (
    projectId: string,
    request: ImportConfirmRequest
): Promise<ImportResult> => {
    try {
        const idToken = getIdToken();
        const response = await fetch(
            `${config.LOCAL_API_URL}/import/confirm/?project_id=${projectId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to confirm import: ${response.status} ${errorMessage}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error confirming import:", error);
        throw error;
    }
};
