import config from "@/config";
import { getIdToken } from "@/api/auth/authToken";

type FileUploadResponse = {
  file: string;
  url: string;
  public: boolean;
}

export const uploadFileMultipart = async (
    file: File,
    projectId: string,
    visibility: "public" | "private"
): Promise<{ files: FileUploadResponse[] } | { error: string }> => {
    try {
        const idToken = getIdToken();
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            `${config.API_URL}/upload/${projectId}/${visibility}/`,
            {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Upload error:", error);
        return { error: (error as Error).message };
    }
};

export const uploadFileBase64 = async (
    file: File,
    directory: string,
    projectId: string,
    visibility: "public" | "private"
): Promise<{ files: FileUploadResponse[] } | { error: string }> => {
    try {
        const idToken = getIdToken();

        const toBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(",")[1]); // Verwijder `data:*/*;base64,`
                reader.onerror = (error) => reject(error);
            });
        };

        const base64Content = await toBase64(file);

        const payload = {
            files: [{
                filename: file.name,
                directory: directory,
                content: base64Content,
            }]
        };

        const response = await fetch(
            `${config.API_URL}/upload/${projectId}/${visibility}/`,
            {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Upload error:", error);
        return { error: (error as Error).message };
    }
};
