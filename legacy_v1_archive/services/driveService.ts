
import { DriveFile } from "../types";

// Scope: drive.file only grants access to files opened by the user in Picker
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

// Robust Env Getter (Duplicate of logic in other services to remain standalone)
const getSafeEnv = (key: string, fallback: string): string => {
    try {
        // @ts-ignore
        if (import.meta.env[key]) return import.meta.env[key];
    } catch (e) {}
    
    // Obfuscated fallback check
    if (fallback.includes("Uhl")) {
        try { return atob(fallback).split('').reverse().join(''); } catch(e) { return ""; }
    }
    return "";
};

// Use the existing key logic but defined locally to break dependency on broken firebase.ts
const GOOGLE_PICKER_KEY = getSafeEnv("VITE_FIREBASE_API_KEY", "QUpSWDFYbHFSNHFpU3VBcnB4PxMcUhlUhB538PqHDySazIA=");

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
        const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
        view.setMimeTypes("application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.google-apps.document,application/vnd.google-apps.presentation");
        view.setIncludeFolders(true); // Allow navigating folders
        view.setSelectFolderEnabled(false); // We want file selection (can be multiple files inside a folder)

        const picker = new window.google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(accessToken)
            .setDeveloperKey(GOOGLE_PICKER_KEY)
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

export const extractFolderId = (link: string) => null;
export const listDriveFiles = async () => [];
