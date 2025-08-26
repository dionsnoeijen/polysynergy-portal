import { getIdToken } from "@/api/auth/authToken";
import config from "@/config";

export type DocumentationApiResponse = {
    categories: DocumentationCategory[];
    guides: Record<string, DocumentationDocument[]>;
    meta: {
        total_guides: number;
        last_updated: string;
    };
};

export type DocumentationCategory = {
    id: string;
    title: string;
    description: string;
    icon: string;
    order: number;
};

export type DocumentationDocument = {
    id: string;
    title: string;
    category: string;
    description: string;
    tags: string[];
    order: number;
    last_updated: string;
    content: string;
    body: string;
    metadata?: Record<string, unknown>;
};

export type DocumentationSearchResponse = {
    query: string;
    results: DocumentationSearchResult[];
    total: number;
};

export type DocumentationSearchResult = {
    id: string;
    category: string;
    type: string;
    title: string;
    description: string;
    tags: string[];
    score: number;
    snippet: string;
    url: string;
};

export type DocumentationCategoryResponse = {
    category: string;
    documents: DocumentationDocument[];
    total: number;
};

// Fetch all documentation organized by categories
export const fetchAllDocumentationAPI = async (): Promise<DocumentationApiResponse> => {
    const idToken = getIdToken();
    if (!idToken) {
        throw new Error('Authentication token not available');
    }
    
    const response = await fetch(`${config.LOCAL_API_URL}/documentation/`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Documentation API error:', response.status, errorText);
        throw new Error(`Failed to fetch documentation: ${response.status} - ${errorText}`);
    }

    return await response.json();
};

// Fetch categories only
export const fetchCategoriesAPI = async () => {
    const idToken = getIdToken();
    if (!idToken) {
        throw new Error('Authentication token not available');
    }
    
    const response = await fetch(`${config.LOCAL_API_URL}/documentation/categories`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Categories API error:', response.status, errorText);
        throw new Error(`Failed to fetch categories: ${response.status} - ${errorText}`);
    }

    return await response.json();
};

// Search across all documentation
export const searchDocumentationAPI = async (query: string): Promise<DocumentationSearchResponse> => {
    const idToken = getIdToken();
    if (!idToken) {
        throw new Error('Authentication token not available');
    }
    
    const response = await fetch(`${config.LOCAL_API_URL}/documentation/search?q=${encodeURIComponent(query)}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to search documentation: ${response.status}`);
    }

    return await response.json();
};

// Get specific document by category and ID
export const fetchDocumentAPI = async (category: string, docId: string): Promise<DocumentationDocument> => {
    const idToken = getIdToken();
    if (!idToken) {
        throw new Error('Authentication token not available');
    }
    
    const response = await fetch(`${config.LOCAL_API_URL}/documentation/${encodeURIComponent(category)}/${encodeURIComponent(docId)}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
    }

    return await response.json();
};

// Get documents by category
export const fetchDocumentsByCategoryAPI = async (category: string): Promise<DocumentationCategoryResponse> => {
    const idToken = getIdToken();
    if (!idToken) {
        throw new Error('Authentication token not available');
    }
    
    const response = await fetch(`${config.LOCAL_API_URL}/documentation/${encodeURIComponent(category)}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch documents for category: ${response.status}`);
    }

    return await response.json();
};

// Get node-specific documentation
export const fetchNodeDocumentationAPI = async (nodeType: string): Promise<DocumentationDocument> => {
    const idToken = getIdToken();
    if (!idToken) {
        throw new Error('Authentication token not available');
    }
    
    const response = await fetch(`${config.LOCAL_API_URL}/documentation/nodes/${encodeURIComponent(nodeType)}`, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch node documentation: ${response.status}`);
    }

    return await response.json();
};