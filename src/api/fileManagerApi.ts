import config from "@/config";
import { getIdToken } from "@/api/auth/authToken";

// File Manager Types
export type FileInfo = {
    name: string;
    path: string;
    size: number;
    content_type: string;
    last_modified: string;
    url?: string;
    is_directory: boolean;
    custom_metadata?: Record<string, string>;
};

export type DirectoryInfo = {
    name: string;
    path: string;
    last_modified: string;
    is_directory: boolean;
    file_count?: number;
};

export type DirectoryContents = {
    path: string;
    files: FileInfo[];
    directories: DirectoryInfo[];
    total_files: number;
    total_directories: number;
};

export type FileUploadResponse = {
    success: boolean;
    file_path: string;
    url?: string;
    size: number;
    content_type: string;
    message: string;
};

export type FileOperationResponse = {
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
};

export type FileBatchOperationResponse = {
    success: boolean;
    successful_operations: string[];
    failed_operations: { path: string; error: string }[];
    message: string;
};

export type FileSearchResponse = {
    query: string;
    results: FileInfo[];
    total_results: number;
    search_path?: string;
};

export type FileListParams = {
    path?: string;
    sort_by?: 'name' | 'size' | 'modified';
    sort_order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
};

export type DirectoryCreateRequest = {
    directory_name: string;
    parent_path?: string;
};

export type FileOperationRequest = {
    source_path: string;
    destination_path: string;
};

export type FileBatchDeleteRequest = {
    file_paths: string[];
};

// API Service Class
export class FileManagerApi {
    private projectId: string;

    constructor(projectId: string) {
        this.projectId = projectId;
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const idToken = getIdToken();
        const url = `${config.LOCAL_API_URL}/projects/${this.projectId}/files${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return response.json();
    }

    private async makeFormRequest<T>(
        endpoint: string,
        formData: FormData,
        options: RequestInit = {}
    ): Promise<T> {
        const idToken = getIdToken();
        const url = `${config.LOCAL_API_URL}/projects/${this.projectId}/files${endpoint}`;

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                Authorization: `Bearer ${idToken}`,
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return response.json();
    }

    // List directory contents
    async listFiles(params: FileListParams = {}): Promise<DirectoryContents> {
        const searchParams = new URLSearchParams();
        
        if (params.path) searchParams.append('path', params.path);
        if (params.sort_by) searchParams.append('sort_by', params.sort_by);
        if (params.sort_order) searchParams.append('sort_order', params.sort_order);
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.offset) searchParams.append('offset', params.offset.toString());

        const queryString = searchParams.toString();
        const endpoint = queryString ? `/?${queryString}` : '/';

        return this.makeRequest<DirectoryContents>(endpoint, {
            method: 'GET',
        });
    }

    // Upload single file
    async uploadFile(
        file: File,
        folderPath?: string,
        isPublic: boolean = false
    ): Promise<FileUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        if (folderPath) formData.append('folder_path', folderPath);
        formData.append('public', isPublic.toString());

        return this.makeFormRequest<FileUploadResponse>(
            '/upload',
            formData
        );
    }

    // Upload multiple files
    async uploadMultipleFiles(
        files: File[],
        folderPath?: string,
        isPublic: boolean = false
    ): Promise<FileUploadResponse[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        if (folderPath) formData.append('folder_path', folderPath);
        formData.append('public', isPublic.toString());

        return this.makeFormRequest<FileUploadResponse[]>(
            '/upload-multiple',
            formData
        );
    }

    // Delete file or directory
    async deleteFile(
        filePath: string,
        isDirectory: boolean = false
    ): Promise<FileOperationResponse> {
        const encodedPath = encodeURIComponent(filePath);
        const searchParams = new URLSearchParams();
        if (isDirectory) searchParams.append('is_directory', 'true');

        const queryString = searchParams.toString();
        const endpoint = `/${encodedPath}${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest<FileOperationResponse>(endpoint, {
            method: 'DELETE',
        });
    }

    // Batch delete files
    async batchDeleteFiles(filePaths: string[]): Promise<FileBatchOperationResponse> {
        const request: FileBatchDeleteRequest = { file_paths: filePaths };

        return this.makeRequest<FileBatchOperationResponse>('/batch-delete', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    // Create directory
    async createDirectory(
        directoryName: string,
        parentPath?: string
    ): Promise<FileOperationResponse> {
        const request: DirectoryCreateRequest = {
            directory_name: directoryName,
            parent_path: parentPath,
        };

        return this.makeRequest<FileOperationResponse>('/directory', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    // Move or rename file
    async moveFile(
        sourcePath: string,
        destinationPath: string
    ): Promise<FileOperationResponse> {
        const request: FileOperationRequest = {
            source_path: sourcePath,
            destination_path: destinationPath,
        };

        return this.makeRequest<FileOperationResponse>('/move', {
            method: 'PUT',
            body: JSON.stringify(request),
        });
    }

    // Get file metadata
    async getFileMetadata(filePath: string): Promise<FileInfo> {
        const encodedPath = encodeURIComponent(filePath);
        return this.makeRequest<FileInfo>(`/metadata/${encodedPath}`, {
            method: 'GET',
        });
    }

    // Update file metadata
    async updateFileMetadata(filePath: string, metadata: Record<string, string>): Promise<FileOperationResponse> {
        const encodedPath = encodeURIComponent(filePath);
        return this.makeRequest<FileOperationResponse>(`/metadata/${encodedPath}`, {
            method: 'PUT',
            body: JSON.stringify({ metadata })
        });
    }

    // Search files
    async searchFiles(
        query: string,
        searchPath?: string
    ): Promise<FileSearchResponse> {
        const searchParams = new URLSearchParams();
        searchParams.append('query', query);
        if (searchPath) searchParams.append('search_path', searchPath);

        return this.makeRequest<FileSearchResponse>(`/search?${searchParams.toString()}`, {
            method: 'GET',
        });
    }

    // Health check
    async healthCheck(): Promise<{ status: string; [key: string]: unknown }> {
        return this.makeRequest<{ status: string; [key: string]: unknown }>('/health', {
            method: 'GET',
        });
    }
}

// Factory function to create API instance
export const createFileManagerApi = (projectId: string) => {
    return new FileManagerApi(projectId);
};

// Export default instance (requires project ID to be set later)
export default FileManagerApi;