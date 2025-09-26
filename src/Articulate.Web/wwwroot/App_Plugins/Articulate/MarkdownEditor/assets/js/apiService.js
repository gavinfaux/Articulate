import { config } from './config.js';
import { authService } from './authService.js';

async function buildApiError(response, fallbackMessage) {
    const error = new Error(fallbackMessage || response.statusText || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.isAuthError = response.status === 401;
    error.isForbidden = response.status === 403;
    error.isNetworkError = response.status === 0;

    try {
        const clone = response.clone();
        const contentType = clone.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            error.problemDetails = await clone.json();
        } else {
            const text = await clone.text();
            if (text && text.trim().length) {
                error.rawBody = text;
            }
        }
    } catch (parseError) {
        console.warn('[apiService] Failed to parse error response payload', parseError);
    }

    if (error.problemDetails?.title) {
        error.message = error.problemDetails.title;
    } else if (error.rawBody && !fallbackMessage) {
        error.message = error.rawBody;
    }

    return error;
}

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
        throw await buildApiError(response, 'Failed to publish blog post.');
    }

    return response.json();
}

async function getCurrentUser() {
    const token = await authService.getAccessToken();
    if (!token) {
        const error = new Error('User not authenticated');
        error.isAuthError = true;
        throw error;
    }

    const response = await fetch(config.currentUserUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw await buildApiError(response, 'Failed to fetch user data.');
    }

    return response.json();
}

export const apiService = {
    createPost,
    getCurrentUser,
};
