import { Authentication, Posts } from '@api/sdk.gen';
import '@picocss/pico';
import Alpine from 'alpinejs';
import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';

window.Alpine = Alpine;

document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({
        step: 1, // 1: login, 2: editor, 3: optional info, 4: success
        isAuthenticated: false,
        isLoading: true,
        errorMessage: '',
        formData: {
            username: '', // This is used as the emailAddress for the login API
            password: '',
            title: '',
            markdown: '# Hello World',
            author: '',
            tags: '',
            published: new Date().toISOString().slice(0, 16),
            excerpt: ''
        },
        easyMDE: null as EasyMDE | null,



        init() {
            this.checkAuthStatus();

            this.$watch('step', (newStep) => {
                if (newStep === 2 && !this.easyMDE) {
                    this.$nextTick(() => {
                        if (this.$refs.editor) {
                            this.easyMDE = new EasyMDE({
                                element: document.getElementById('markdown-editor-textarea')!,
                                initialValue: this.formData.markdown,
                                uploadImage: true,
                                imageUploadEndpoint: '/umbraco/api/ArticulateMarkdownEditor/UploadImage',
                                imageMaxSize: 1024 * 1024 * 10, // 10MB
                                imageAccept: 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/heic,image/tiff',
                            });
                            this.easyMDE.codemirror.on('change', () => {
                                if (this.easyMDE) {
                                    this.formData.markdown = this.easyMDE.value();
                                }
                            });
                        }
                    });
                }
            });
        },

        async checkAuthStatus() {
            this.isLoading = true;
            this.errorMessage = '';
            try {
                const status = await Authentication.getAuthenticationStatus();
                if (status.data?.isAuthenticated) {
                    this.isAuthenticated = true;
                    this.step = 2; // Go to editor
                } else {
                    this.isAuthenticated = false;
                    this.step = 1; // Stay on login
                }
            } catch (error: any) {
                this.errorMessage = `Could not verify authentication status: ${error.message}`;
                this.isAuthenticated = false;
                this.step = 1;
            } finally {
                this.isLoading = false;
            }
        },

        async handleLogin() {
            this.isLoading = true;
            this.errorMessage = '';
            try {
                await Authentication.postAuthenticationLogin({
                    body: {
                        emailAddress: this.formData.username,
                        password: this.formData.password,
                    },
                } as any);
                this.isAuthenticated = true;
                this.step = 2;
            } catch (error: any) {
                this.isAuthenticated = false;
                this.errorMessage = error.data?.detail || 'Login failed. Please check your credentials.';
            } finally {
                this.isLoading = false;
            }
        },

        goToOptionalInfo() {
            this.step = 3;
        },

        goToEditor() {
            this.step = 2;
        },

        async handlePublish() {
            this.isLoading = true;
            this.errorMessage = '';
            try {
                const postData = {
                    title: this.formData.title,
                    body: this.formData.markdown,
                    author: this.formData.author,
                    tags: this.formData.tags,
                    published: this.formData.published,
                    excerpt: this.formData.excerpt,
                };

                await Posts.postArticulatePostsMarkdown({
                    body: {
                        json: JSON.stringify(postData)
                    }
                });
                this.step = 4; // success
            } catch (error: any) {
                this.errorMessage = error.data?.detail || 'Failed to publish post. Please try again.';
            } finally {
                this.isLoading = false;
            }
        },
    }));
});

// Start Alpine.js
Alpine.start();

console.log("main.ts loaded and Alpine started.");
