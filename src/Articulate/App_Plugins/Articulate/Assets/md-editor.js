document.addEventListener("alpine:init", () => {
    const STEPS = Object.freeze({
        LOADING: 'loading',
        LOGIN: 'login',
        EDITOR: 'editor',
        OPTIONAL: 'optional',
        SUCCESS: 'success',
    });

    Alpine.data("app", () => ({
        // --- State Management ---
        step: STEPS.LOADING,
        submitting: false,
        isEditorInitializing: false,
        isAuthenticated: false,
        fileMap: new Map(),
        editor: null,
        csrfToken: null,
        caption: "Create a new post",

        // --- URLs ---
        authSigninUrl: "",
        authSignoutUrl: "",
        authCsrfUrl: "",
        authStatusUrl: "",
        postUrl: "",
        successUrl: "#",
        twoFactorUrl: "",

        // --- Models & Validation ---
        login: {
            emailAddress: "",
            password: "",
            validation: { // For material design style effects
                emailAddress: true,
                password: true,
            }
        },
        post: {
            articulateNodeId: "",
            title: "",
            markdown: "",
            author: "",
            tags: "",
            categories: "",
            published: new Date().toISOString().slice(0, 16),
            excerpt: "",
            slug: "",
        },

        // --- Getters for CSP Compliance ---
        get isLoading() { return this.step === STEPS.LOADING || this.submitting; },
        get isLoginStep() { return this.step === STEPS.LOGIN; },
        get isEditorStep() { return this.step === STEPS.EDITOR; },
        get isOptionalStep() { return this.step === STEPS.OPTIONAL; },
        get isSuccessStep() { return this.step === STEPS.SUCCESS; },

        get isEmailInvalid() { return !this.login.validation.emailAddress; },
        get isPasswordInvalid() { return !this.login.validation.password; },

        get canShowNextButton() { return this.isEditorStep && this.post.title && this.post.markdown; },

        // --- Initialization ---
        async init() {
            console.info("Alpine component initializing...");
            this.loadUrlsFromDataset();
            await this.getCsrfToken();
            if (this.csrfToken) {
                await this.checkAuthStatus();
            }
            this.setupWatchers();

            // Ensure MDL components are upgraded after initial setup
            this.$nextTick(() => {
                if (window.componentHandler) {
                    window.componentHandler.upgradeDom();
                }
            });
        },

        loadUrlsFromDataset() {
            const bodyEl = document.body;
            this.authSigninUrl = bodyEl.dataset.authSigninUrl;
            this.authSignoutUrl = bodyEl.dataset.authSignoutUrl;
            this.authCsrfUrl = bodyEl.dataset.authCsrfUrl;
            this.authStatusUrl = bodyEl.dataset.authStatusUrl;
            this.postUrl = bodyEl.dataset.postUrl;
            this.post.articulateNodeId = bodyEl.dataset.articulateNodeId;
        },

        setupWatchers() {
            this.$watch("step", (newStep) => {
                if (newStep === STEPS.EDITOR && !this.editor && !this.isEditorInitializing) {
                    this.initializeEditor();
                }

                // Ensure MDL components are upgraded after AlpineJS updates the DOM
                this.$nextTick(() => {
                    if (window.componentHandler) {
                        window.componentHandler.upgradeDom();
                    }
                });
            });
        },

        initializeEditor() {
            this.isEditorInitializing = true;
            this.$nextTick(() => {
                const editorTextarea = this.$refs.editor;
                const editorWrapper = document.createElement('div');
                editorWrapper.className = 'editor-wrapper';
                editorTextarea.parentNode.insertBefore(editorWrapper, editorTextarea);

                editorTextarea.addEventListener('input', () => {
                    editorWrapper.textContent = editorTextarea.value;
                });

                this.editor = new TinyMDE.Editor({
                    element: editorTextarea,
                    content: this.post.markdown,
                    commandBar: false
                });

                this.editor.addEventListener("change", () => {
                    this.post.markdown = this.editor.getContent();
                    editorWrapper.textContent = this.post.markdown; // Update wrapper on change
                });

                // Initial sync
                editorWrapper.textContent = this.post.markdown;

                console.info("tiny-markdown-editor initialized with auto-grow.");
            });
        },

        // --- Authentication ---
        async getCsrfToken() {
            try {
                const response = await fetch(this.authCsrfUrl);
                if (!response.ok) throw new Error(`CSRF token fetch failed with status: ${response.status}`);
                const data = await response.json();
                this.csrfToken = data.requestToken;
            } catch (error) {
                console.error("A security token could not be loaded. Please refresh the page.", error);
                this.step = STEPS.LOGIN; // Fallback to login
            }
        },

        async checkAuthStatus() {
            try {
                const response = await fetch(this.authStatusUrl);
                // A 401 is an expected 'not logged in' state, not an error.
                if (response.status === 401) {
                    this.isAuthenticated = false;
                    this.step = STEPS.LOGIN;
                    return;
                }
                if (!response.ok) throw new Error(`Auth status check failed with status: ${response.status}`);

                const result = await response.json();
                if (result.isAuthenticated) {
                    this.isAuthenticated = true;
                    this.step = STEPS.EDITOR;
                } else {
                    this.isAuthenticated = false;
                    this.step = STEPS.LOGIN;
                }
            } catch (error) {
                console.warn("Could not verify login status.", error);
                this.step = STEPS.LOGIN;
            }
        },

        validateLoginFields() {
            this.login.validation.emailAddress = !!this.login.emailAddress;
            this.login.validation.password = !!this.login.password;
            return this.login.validation.emailAddress && this.login.validation.password;
        },

        async handleLogin() {
            if (!this.validateLoginFields()) {
                return;
            }

            this.submitting = true;
            this.twoFactorUrl = '';

            try {
                const response = await fetch(this.authSigninUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'RequestVerificationToken': this.csrfToken
                    },
                    body: JSON.stringify(this.login)
                });

                if (response.status === 401) {
                    this.login.validation.emailAddress = false;
                    this.login.validation.password = false;
                    console.warn('Login failed: Invalid credentials.');
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || `Login request failed with status: ${response.status}`);
                }

                const result = await response.json();

                if (result.requiresTwoFactor) {
                    this.twoFactorUrl = result.redirectUrl;
                    console.info('Two-factor authentication required.');
                } else if (result.loginSuccess) {
                    this.isAuthenticated = true;
                    this.step = STEPS.EDITOR;
                }

            } catch (error) {
                console.error('An error occurred during login:', error);
                // Indicate a general error on fields if something unexpected happens
                this.login.validation.emailAddress = false;
                this.login.validation.password = false;
            } finally {
                this.submitting = false;
            }
        },

        // --- File & Post Handling (To be implemented) ---
        triggerImageUpload() {
            this.$refs.imageUpload.click();
        },

        triggerCamera() {
            this.$refs.cameraUpload.click();
        },

        handleFileSelect(event) {
            const files = event.target.files;
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
            const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif)$/i;

            for (const file of files) {
                if (!file) continue;

                // 1. MIME Type Check
                if (!ALLOWED_TYPES.includes(file.type)) {
                    console.info(`Rejected file: Invalid MIME type - ${file.name} (${file.type})`);
                    continue;
                }

                // 2. File Extension Check
                if (!ALLOWED_EXTENSIONS.test(file.name)) {
                    console.info(`Rejected file: Invalid extension - ${file.name}`);
                    continue;
                }

                // 3. File Size Check
                if (file.size > MAX_FILE_SIZE) {
                    console.info(`Rejected file: Exceeds 10MB size limit - ${file.name}`);
                    continue;
                }

                // 4. File Name Normalization and Path Traversal Check
                let normalizedName = file.name.replace(/\\/g, "/");
                if (normalizedName.match(/^\.\.|\/\.\./)) {
                    console.info(`Rejected file: Potential path traversal - ${file.name}`);
                    continue;
                }

                // 5. Sanitize and Validate Length
                // Remove potentially harmful characters, allowing a basic set.
                let sanitizedName = normalizedName.split('/').pop().replace(/[^a-zA-Z0-9_.-]/g, '');
                if (sanitizedName.length === 0 || sanitizedName.length > 255) {
                    console.info(`Rejected file: Invalid filename length after sanitization - ${file.name}`);
                    continue;
                }

                // All checks passed, proceed with adding the file
                const index = this.fileMap.size;
                const placeholderUrl = `tmp:${index}:${sanitizedName}`;
                this.fileMap.set(placeholderUrl, file);

                const markdownToInsert = `![${sanitizedName}](${placeholderUrl})`;
                this.editor.paste(markdownToInsert);
            }
        },

        goToEditorStep() { this.step = STEPS.EDITOR; },
        goToOptionalStep() { this.step = STEPS.OPTIONAL; },

        goToNextStep() {
            if (this.post.title && this.post.markdown) {
                this.step = STEPS.OPTIONAL;
            }
        },

        resetForNewPost() {
            this.step = STEPS.LOADING; // show progress bar briefly
            this.post.title = "";
            this.post.markdown = "";
            this.post.tags = "";
            this.post.categories = "";
            this.post.excerpt = "";
            this.post.slug = "";
            this.post.published = new Date().toISOString().slice(0, 16);
            this.fileMap.clear();
            if (this.editor) {
                this.editor.setContent('');
            }
            this.successUrl = "#";
            this.$nextTick(() => this.step = STEPS.EDITOR);
        },

        async handlePublish() {
            this.submitting = true;

            const formData = new FormData();
            formData.append('json', JSON.stringify(this.post));

            for (const [key, file] of this.fileMap.entries()) {
                formData.append(key, file);
            }

            try {
                const response = await fetch(this.postUrl, {
                    method: 'POST',
                    headers: {
                        'RequestVerificationToken': this.csrfToken
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || `Publish request failed with status: ${response.status}`);
                }

                const result = await response.json();
                this.successUrl = result.url || '#';
                this.step = STEPS.SUCCESS;

            } catch (error) {
                console.warn('Failed to publish post:', error);
                this.step = STEPS.OPTIONAL; // Return to optional step on failure
            } finally {
                this.submitting = false;
            }
        }
    }));
});
