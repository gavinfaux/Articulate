import { config, initConfig } from './config.js';
import { authService } from './authService.js';
import { apiService } from './apiService.js';
import { uiService } from './uiService.js';
import { formatApiError } from './error-formatter.js';

document.addEventListener('alpine:init', () => {
    const alpine = window.Alpine;
    if (!alpine) {
        console.error('[MarkdownEditor] Alpine.js is not available on window. Component initialisation aborted.');
        return;
    }

    alpine.data('markdownEditor', () => ({
        // --- Reactive State ---
        isLoading: true,
        errorDetails: null, // { title: '', details: [] }
        post: {
            articulateBlogNode: null,
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
            buttonText: 'OK',
            onConfirm: () => {},
        },
        currentUser: null,
        successUrl: null,
        caption: 'Create New Post',
        currentStep: 'loading',
        editorInstance: null,
        loginNotice: '',

        // --- Getters for CSP-compliant logic ---
        get hasErrorDetails() {
            return this.errorDetails && this.errorDetails.details && this.errorDetails.details.length > 0;
        },

        get isNotLoading() {
            return !this.isLoading;
        },

        get userInitials() {
            if (!this.currentUser || !this.currentUser.name) return '...';
            const nameParts = this.currentUser.name.trim().split(' ');
            if (nameParts.length > 1) {
                return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
            }
            return nameParts[0][0] ? nameParts[0][0].toUpperCase() : '';
        },

        get postTitle() {
            return this.post.title;
        },

        get postTags() {
            return this.post.tags;
        },

        get postCategories() {
            return this.post.categories;
        },

        get postExcerpt() {
            return this.post.excerpt;
        },

        get postSlug() {
            return this.post.slug;
        },

        get titleErrorClass() {
            return this.post.title.trim().length ? '' : 'is-invalid';
        },

        get titleCssClass() {
            const classes = [];
            if ((this.post.title ?? '').trim().length > 0) {
                classes.push('is-dirty');
            }

            const errorClass = this.titleErrorClass;
            if (errorClass) {
                classes.push(errorClass);
            }

            return classes.join(' ');
        },

        fieldCssClass(field) {
            const value = (this.post[field] ?? '').trim();
            return value.length > 0 ? 'is-dirty' : '';
        },

        get isEditorStep() {
            return this.currentStep === 'editor';
        },

        get isOptionalStep() {
            return this.currentStep === 'optional';
        },

        get isSuccessStep() {
            return this.currentStep === 'success';
        },

        get isLoginStep() {
            return this.currentStep === 'login';
        },

        get canShowNextButton() {
            return this.currentStep === 'editor';
        },

        get canShowPublishButton() {
            return this.currentStep === 'optional';
        },

        get canProceedToOptional() {
            const titleFilled = this.post.title.trim().length > 0;
            const bodyFilled = (this.post.body ?? '').trim().length > 0;
            return titleFilled && bodyFilled;
        },

        get canPublish() {
            return this.canProceedToOptional;
        },

        get disableNextButton() {
            return !this.canProceedToOptional;
        },

        get disablePublishButton() {
            return !this.canPublish;
        },

        setStep(step) {
            if (step && step !== this.currentStep) {
                console.debug('[MarkdownEditor] transitioning to step:', step);
            }
            this.currentStep = step;

            switch (step) {
                case 'editor':
                    this.caption = 'New Blog Post';
                    break;
                case 'optional':
                    this.caption = 'Optional Details';
                    break;
                case 'success':
                    this.caption = 'Post Successful';
                    break;
                case 'login':
                    this.caption = 'Sign in';
                    break;
                default:
                    this.caption = 'Create New Post';
                    break;
            }
        },

        redirectToLogin() {
            console.info('[MarkdownEditor] redirecting to Umbraco back-office OAuth');
            authService.redirectToLogin();
        },

        startLogin() {
            this.isLoading = true;
            this.redirectToLogin();
        },

        initializeEditor() {
            if (!this.isEditorStep) {
                return;
            }

            const textarea = this.$refs.editor;
            if (!textarea) {
                return;
            }

            const tinyMde = window.TinyMDE;
            if (!tinyMde || !tinyMde.Editor) {
                console.error('[MarkdownEditor] TinyMDE is not available; ensure the script is loaded.');
                return;
            }

            if (this.editorInstance && this.editorInstance.textarea === textarea) {
                if (typeof this.editorInstance.getContent === 'function' && this.post.body !== this.editorInstance.getContent()) {
                    this.editorInstance.setContent(this.post.body ?? '');
                }
                return;
            }

            this.editorInstance = new tinyMde.Editor({
                textarea,
                content: this.post.body ?? '',
            });

            this.editorInstance.addEventListener('change', (event) => {
                this.post.body = event.content;
            });
        },

        // --- Initialization ---
        async init() {
            try {
                console.info('[MarkdownEditor] initializing component');
                initConfig(document.body.dataset);

                const parsedNodeId = Number(config.articulateBlogNode);
                this.post.articulateBlogNode = Number.isNaN(parsedNodeId) ? config.articulateBlogNode : parsedNodeId;

                console.debug('[MarkdownEditor] configuration snapshot', {
                    articulateBlogNode: this.post.articulateBlogNode,
                    isBackOfficeLoggedIn: config.isBackOfficeLoggedIn
                });

                if (window.location.search.includes('code=')) {
                    console.debug('[MarkdownEditor] handling OAuth authorization callback');
                    await authService.handleLoginCallback();
                }

                let token = authService.getAccessToken();
                console.debug('[MarkdownEditor] access token present?', Boolean(token));

                if (!token) {
                    console.info('[MarkdownEditor] no access token found; showing login view');
                    this.isLoading = false;
                    this.showLogin('Sign in to the Umbraco back office to continue.');
                    return;
                }

                const sessionEstablished = await authService.ensureBackOfficeSession();
                if (!sessionEstablished) {
                    console.info('[MarkdownEditor] bearer token present but session cookie missing; showing login view');
                    this.isLoading = false;
                    this.showLogin('Your Umbraco session expired. Sign in again to continue.');
                    return;
                }

                if (!config.isBackOfficeLoggedIn) {
                    console.debug('[MarkdownEditor] continuing without pre-existing back-office session; relying on bearer token only.');
                }

                this.currentUser = await apiService.getCurrentUser();
                console.info('[MarkdownEditor] authenticated as:', this.currentUser?.name ?? this.currentUser?.username ?? 'unknown');

                this.setStep('editor');
                await this.$nextTick();
                this.initializeEditor();
                console.info('[MarkdownEditor] initialization complete');

            } catch (error) {
                console.error('Initialization failed:', error);
                const formattedError = await formatApiError(error);
                this.errorDetails = formattedError;

                if (formattedError.isAuthError) {
                    this.showLogin(formattedError.details.join(' '));
                } else {
                    uiService.showDialog(
                        this.$refs.criticalErrorDialog,
                        this.dialog,
                        formattedError.title,
                        formattedError.details.join(' '),
                        () => window.location.reload()
                    );
                }
            } finally {
                this.isLoading = false;
            }
        },

        // --- UI Methods ---
        async handlePublish() {
            if (!this.canPublish) {
                this.errorDetails = {
                    title: 'Missing required fields',
                    details: ['Title and content are required before publishing.'],
                };
                return;
            }

            this.isLoading = true;
            this.errorDetails = null;

            try {
                const result = await apiService.createPost(this.post, this.fileMap);
                // On success, display url
                if (result.url) {
                    this.successUrl = result.url;
                    this.setStep('success');
                    console.info('[MarkdownEditor] publish complete; success url:', result.url);
                    //window.location.href = result.url;
                } else {
                    throw new Error("Received an empty or invalid URL from the server.");
                }
            } catch (error) {
                const formattedError = await formatApiError(error);
                this.errorDetails = formattedError;

                // For auth/network/permission failures, surface a dialog.
                if (formattedError.isAuthError || formattedError.isNetworkError || formattedError.isForbidden) {
                    uiService.showDialog(
                        this.$refs.criticalErrorDialog,
                        this.dialog,
                        formattedError.title,
                        formattedError.details.join(' '),
                        formattedError.isAuthError ? () => this.redirectToLogin() : null
                    );
                }
            } finally {
                this.isLoading = false;
            }
        },

        goToOptionalStep() {
            if (!this.canProceedToOptional) {
                return;
            }
            this.setStep('optional');
        },

        goToEditorStep() {
            this.setStep('editor');
            this.$nextTick(() => this.initializeEditor());
        },

        resetForNewPost() {
            const nodeId = this.post.articulateBlogNode;
            this.post = {
                articulateBlogNode: nodeId,
                title: '',
                body: '',
                excerpt: '',
                tags: '',
                categories: '',
                slug: '',
            };
            this.fileMap.clear();
            this.successUrl = null;
            this.errorDetails = null;
            this.setStep('editor');
            this.$nextTick(() => this.initializeEditor());
        },

        updatePostTitle(event) {
            this.post.title = event?.target?.value ?? '';
        },

        updatePostField(event) {
            const field = event?.target?.id;
            const value = event?.target?.value ?? '';

            switch (field) {
                case 'tags':
                    this.post.tags = value;
                    break;
                case 'categories':
                    this.post.categories = value;
                    break;
                case 'excerpt':
                    this.post.excerpt = value;
                    break;
                case 'slug':
                    this.post.slug = value;
                    break;
                default:
                    break;
            }
        },

        handleImageUpload(event) {
            const files = Array.from(event?.target?.files ?? []);
            if (!files.length) return;

            files.forEach((file) => {
                // Use a robust key for the map
                const tempUrl = `tmp:${Date.now()}_${Math.random().toString(36).substring(2, 9)}:${file.name}`;
                this.fileMap.set(tempUrl, file);

                const placeholder = `![Uploading ${file.name}...](${tempUrl})\n`;

                if (this.editorInstance && typeof this.editorInstance.paste === 'function') {
                    this.editorInstance.paste(placeholder);
                } else {
                    this.post.body = `${this.post.body}${placeholder}`;
                }
            });

            // Clear the file input for the next upload
            if (event?.target) {
                event.target.value = '';
            }
        },
        triggerImageUpload() {
            this.$refs.imageUpload?.click();
        },

        triggerCamera() {
            this.$refs.cameraUpload?.click();
        },

        confirmCriticalError() {
            if (this.dialog.onConfirm && typeof this.dialog.onConfirm === 'function') {
                this.dialog.onConfirm();
            }
            this.$refs.criticalErrorDialog?.close();
            this.resetDialogState();
        },

        async logout() {
            this.isLoading = true;
            try {
                await authService.logout();
                this.showLogin('You have been signed out. Sign in again to continue.');
            } catch (error) {
                console.error('[MarkdownEditor] logout failed', error);
                const formattedError = await formatApiError(error, 'Sign-out failed');
                this.errorDetails = formattedError;

                uiService.showDialog(
                    this.$refs.criticalErrorDialog,
                    this.dialog,
                    formattedError.title,
                    formattedError.details.join(' '),
                    () => this.redirectToLogin(),
                    'Continue to login'
                );
            } finally {
                this.isLoading = false;
            }
        },

        handleDialogClose() {
            this.resetDialogState();
        },

        resetDialogState() {
            this.dialog.buttonText = 'OK';
            this.dialog.onConfirm = () => {};
        },

        showLogin(message) {
            this.currentUser = null;
            this.loginNotice = message || 'Sign in to the Umbraco back office to continue.';
            this.errorDetails = null;
            this.setStep('login');
        },
    }));
});
