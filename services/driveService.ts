
import { DriveFile } from "../types";

// Scope: drive.file only grants access to files opened by the user in Picker
// This is non-sensitive and usually bypasses strict verification checks.
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return "";
};

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Check if scripts are loaded
const loadGapi = async () => {
    return new Promise((resolve) => {
        if (window.gapi) resolve(window.gapi);
        else window.addEventListener('load', () => resolve(window.gapi));
    });
};

export const openDrivePicker = async (accessToken: string): Promise<DriveFile[]> => {
    await loadGapi();
    
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.picker) {
            // Need to load the picker API
            window.gapi.load('picker', {
                callback: () => {
                    createPicker(accessToken, resolve, reject);
                }
            });
        } else {
            createPicker(accessToken, resolve, reject);
        }
    });
};

const createPicker = (accessToken: string, resolve: (files: DriveFile[]) => void, reject: (err: any) => void) => {
    try {
        const apiKey = getEnv('VITE_FIREBASE_API_KEY'); 
        
        const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
        view.setMimeTypes("application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.google-apps.document,application/vnd.google-apps.presentation");
        view.setIncludeFolders(true); // Allow navigating folders
        view.setSelectFolderEnabled(false); // We want file selection (can be multiple files inside a folder)

        const picker = new window.google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(accessToken)
            .setDeveloperKey(apiKey)
            .setCallback((data: any) => {
                if (data.action === window.google.picker.Action.PICKED) {
                    const files = data.docs.map((doc: any) => ({
                        id: doc.id,
                        name: doc.name,
                        mimeType: doc.mimeType,
                        size: doc.sizeBytes
                    }));
                    resolve(files);
                } else if (data.action === window.google.picker.Action.CANCEL) {
                    reject(new Error("Selection Cancelled"));
                }
            })
            // Feature: Enable Multi-Select
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .build();
            
        picker.setVisible(true);
    } catch (e) {
        reject(e);
    }
};

// Download a specific file
// Note: Since we used drive.file scope and the user selected these files in Picker,
// we now have permission to download them.
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

// Helper dummies to satisfy types if needed elsewhere, though unused now
export const extractFolderId = (link: string) => null;
export const listDriveFiles = async () => [];
