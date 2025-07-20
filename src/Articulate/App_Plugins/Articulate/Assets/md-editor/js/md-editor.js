import { config, initConfig } from './config.js';
import { authService } from './authService.js';
import { apiService } from './apiService.js';
import { uiService } from './uiService.js';
import { formatApiError } from './error-formatter.js';

document.addEventListener('alpine:init', () => {
    Alpine.data('markdownEditor', () => ({
        // --- Reactive State ---
        isLoading: true,
        errorDetails: null, // { title: '', details: [] }
        post: {
            articulateNodeId: null,
            title: '',
            body: '',
            excerpt: '',
            tags: '',
            categories: '',
            slug: '',
        },
        fileMap: new Map(),
        dialog: {
            title: '',
            message: '',
            onConfirm: () => {},
        },
        currentUser: null,

        // --- Getters for CSP-compliant logic ---
        get hasErrorDetails() {
            return this.errorDetails && this.errorDetails.details && this.errorDetails.details.length > 0;
        },

        get userInitials() {
            if (!this.currentUser || !this.currentUser.name) return '...';
            const nameParts = this.currentUser.name.trim().split(' ');
            if (nameParts.length > 1) {
                return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
            }
            return nameParts[0][0] ? nameParts[0][0].toUpperCase() : '';
        },

        // --- Initialization ---
        async init() {
            try {
                // 1. Load dynamic configuration from the DOM
                initConfig(document.body.dataset);
                this.post.articulateNodeId = config.articulateNodeId;

                // 2. Check if this is an OAuth callback
                if (window.location.search.includes('code=')) {
                    await authService.handleLoginCallback();
                }

                // 3. Verify we have a token, otherwise redirect to login
                if (!authService.getAccessToken()) {
                    // This is a normal part of the flow, not an error state yet.
                    // The redirect will stop execution here.
                    authService.redirectToLogin();
                    return; 
                }

                // 4. Fetch current user details
                this.currentUser = await apiService.getCurrentUser();

            } catch (error) {
                console.error('Initialization failed:', error);
                this.errorDetails = formatApiError(error);
                 // On init, a failure is always critical
                 uiService.showDialog(
                    this.$refs.criticalErrorDialog,
                    this.dialog,
                    this.errorDetails.title,
                    this.errorDetails.details.join(' '),
                    () => { window.location.reload(); } // Offer a reload on critical init failure
                );
            } finally {
                this.isLoading = false;
            }
        },

        // --- UI Methods ---
        async handlePublish() {
            this.isLoading = true;
            this.errorDetails = null;

            try {
                const result = await apiService.createPost(this.post, this.fileMap);
                // On success, redirect to the newly created post
                if (result.url) {
                    window.location.href = result.url;
                } else {
                    throw new Error("Received an empty or invalid URL from the server.");
                }
            } catch (error) {
                const formattedError = formatApiError(error);
                this.errorDetails = formattedError;

                // If it's an auth error or a critical network failure, show the dialog.
                if (error.isAuthError || error.isNetworkError) {
                    uiService.showDialog(
                        this.$refs.criticalErrorDialog,
                        this.dialog,
                        formattedError.title,
                        formattedError.details.join(' '),
                        // For auth errors, the action is to log in again. For others, just close.
                        error.isAuthError ? () => authService.redirectToLogin() : null
                    );
                }
            } finally {
                this.isLoading = false;
            }
        },

        handleImageUpload(event) {
            const files = Array.from(event.target.files);
            if (!files.length) return;

            const editor = this.$refs.editor;
            const cursorPosition = editor.selectionStart;

            files.forEach((file) => {
                // Use a robust key for the map
                const tempUrl = `tmp:${Date.now()}_${Math.random().toString(36).substring(2, 9)}:${file.name}`;
                this.fileMap.set(tempUrl, file);

                const placeholder = `![Uploading ${file.name}...](${tempUrl})\\n`;
                this.post.body = this.post.body.slice(0, cursorPosition) + placeholder + this.post.body.slice(cursorPosition);
            });

            // Clear the file input for the next upload
            event.target.value = '';
        },

        triggerFileInput() {
            this.$refs.fileInput.click();
        },

        confirmCriticalError() {
            if (this.dialog.onConfirm && typeof this.dialog.onConfirm === 'function') {
                this.dialog.onConfirm();
            }
            this.$refs.criticalErrorDialog.close();
        },

        logout() {
            authService.logout();
        },
    }));
});