
import { DriveFile } from "../types";

// Scopes required for the feature
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return "";
};

// Helper to extract Folder ID from various link formats
export const extractFolderId = (link: string): string | null => {
    try {
        const url = new URL(link);
        // Format 1: https://drive.google.com/drive/folders/12345...
        if (url.pathname.includes('/folders/')) {
            const parts = url.pathname.split('/');
            return parts[parts.indexOf('folders') + 1];
        }
        // Format 2: https://drive.google.com/open?id=12345...
        if (url.searchParams.has('id')) {
            return url.searchParams.get('id');
        }
    } catch (e) {
        // Fallback: Check if user pasted just the ID
        if (link.length > 20 && !link.includes('/')) return link;
    }
    return null;
};

// List files in a specific folder
export const listDriveFiles = async (folderId: string, accessToken: string): Promise<DriveFile[]> => {
    const query = `'${folderId}' in parents and trashed = false`;
    const fields = "files(id, name, mimeType, size)";
    // Increase page size to grab "hundreds" as requested
    const apiKey = getEnv('VITE_FIREBASE_API_KEY');
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=200&key=${apiKey}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Failed to access Drive folder");
    }

    const data = await response.json();
    
    // Filter for supported types
    const supportedMimes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'text/plain',
        'application/vnd.google-apps.document', // Google Doc (needs export)
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' // pptx
    ];

    return (data.files || []).filter((f: any) => supportedMimes.includes(f.mimeType) || f.name.endsWith('.txt') || f.name.endsWith('.md'));
};

// Download a specific file
export const downloadDriveFile = async (fileId: string, mimeType: string, accessToken: string): Promise<Blob> => {
    let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    
    // Handle native Google Docs/Slides (Export)
    if (mimeType === 'application/vnd.google-apps.document') {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
    } else if (mimeType === 'application/vnd.google-apps.presentation') {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.presentationml.presentation`;
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to download file ${fileId}`);
    }

    return await response.blob();
};
