import { config } from './config.js';
import { authService } from './authService.js';

/**
 * Creates a new blog post by sending data to the backend API.
 * @param {object} postData The post data (title, body, etc.).
 * @param {Map<string, File>} fileMap A map of temporary URLs to File objects for images.
 * @returns {Promise<object>} The JSON response from the server.
 */
async function createPost(postData, fileMap) {
    const token = authService.getAccessToken();
    if (!token) {
        // Create a specific error type for session issues
        const error = new Error('Session expired. Please log in again.');
        error.isAuthError = true;
        throw error;
    }

    const formData = new FormData();
    formData.append('json', JSON.stringify(postData));
    for (const [key, file] of fileMap.entries()) {
        formData.append(key, file);
    }

    const response = await fetch(config.editorPostUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            // 'Content-Type' is not needed; the browser sets it for FormData
        },
        body: formData,
    });

    if (!response.ok) {
        // Let the caller handle the non-ok response by throwing the response object itself
        // This allows access to status code and body for detailed error formatting.
        throw response;
    }

    return response.json();
}

async function getCurrentUser() {
    const token = await authService.getAccessToken();
    if (!token) {
        throw new Error('User not authenticated');
    }

    const response = await fetch(config.currentUserUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error = new Error('Failed to fetch user data');
        error.details = errorData;
        if (response.status === 401) {
            error.isAuthError = true;
        }
        throw error;
    }

    return response.json();
}

export const apiService = {
    createPost,
    getCurrentUser,
};