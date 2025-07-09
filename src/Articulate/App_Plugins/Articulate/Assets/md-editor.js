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

        // --- Initialization ---
        async init() {
            console.info("Alpine component initializing...");
            this.loadUrlsFromDataset();
            await this.getCsrfToken();
            if (this.csrfToken) {
                await this.checkAuthStatus();
            }
            this.setupWatchers();
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
            });
        },

        initializeEditor() {
            this.isEditorInitializing = true;
            this.$nextTick(() => {
                this.editor = new TinyMDE.Editor({
                    element: this.$refs.editor,
                    content: this.post.markdown,
                    commandBar: false
                });
                this.editor.addEventListener("change", () => {
                    this.post.markdown = this.editor.getContent();
                });
                console.info("tiny-markdown-editor initialized.");
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

        handleFileSelect(files) {
            // TODO: Implement full file validation logic here
            for (const file of files) {
                if (!file || !file.type.startsWith("image")) continue;
                const index = this.fileMap.size;
                const placeholderUrl = `tmp:${index}:${file.name}`;
                this.fileMap.set(placeholderUrl, file);
                const markdownToInsert = `![${file.name}](${placeholderUrl})`;
                this.editor.paste(markdownToInsert);
            }
        },

        async handlePublish() {
            // TODO: Implement publish logic
            console.log("Publishing...");
        }
    }));
});
