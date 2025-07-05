import Alpine from 'alpinejs';
import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';
import '@picocss/pico';
import { Authentication, Posts } from '../../src/api/sdk.gen';

window.Alpine = Alpine;

document.addEventListener('alpine:init', () => {
    Alpine.data('app', () => ({
        step: 1, // 1: login, 2: editor, 3: optional info, 4: success
        isAuthenticated: false,
        isLoading: true,
        errorMessage: '',
        formData: {
            username: '',
            password: '',
            title: '',
            markdown: '# Hello World',
            author: '',
            tags: '',
            published: new Date().toISOString().slice(0, 16),
            comments: 'Inherit',
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
                                element: this.$refs.editor as HTMLElement,
                                initialValue: this.formData.markdown,
                            });
                            this.easyMDE.codemirror.on('change', () => {
                                this.formData.markdown = this.easyMDE!.value();
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
                const status = await Authentication.getArticulateAuthStatusV1();
                if (status.data?.isAuthenticated) {
                    this.isAuthenticated = true;
                    this.step = 2; // Go to editor
                } else {
                    this.isAuthenticated = false;
                    this.step = 1; // Stay on login
                }
            } catch (error) {
                this.errorMessage = 'Could not verify authentication status.';
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
                await Authentication.postArticulateAuthLoginV1({
                    body: {
                        username: this.formData.username,
                        password: this.formData.password,
                    }
                });
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
                await Posts.postArticulatePostsMarkdown({
                    body: {
                        title: this.formData.title,
                        body: this.formData.markdown,
                        author: this.formData.author,
                        tags: this.formData.tags,
                        published: this.formData.published,
                        excerpt: this.formData.excerpt,
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
