document.addEventListener("alpine:init", () => {
  Alpine.data("app", () => ({
    // --- State Management ---
    step: "loading", // 'loading', 'login', 'editor', 'optional', 'success'
    isAuthenticated: false,
    submitting: false,
    errorMessage: "",
    successUrl: "#",
    caption: "Create a new post",
    fileMap: new Map(),
    editor: null,

    // --- Models ---
    login: {
      emailAddress: "",
      password: "",
    },
    post: {
      title: "",
      markdown: "# Hello World",
      author: "",
      tags: "",
      categories: "",
      published: new Date().toISOString().slice(0, 16),
      excerpt: "",
      slug: "",
    },

    init() {
      console.info("Alpine component initializing...");
      this.checkAuthStatus();

      this.$watch("step", (newStep) => {
        if (newStep === "editor" && !this.editor) {
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
        }
      });

      this.$refs.imageUpload.addEventListener('change', (event) => this.handleFileSelect(event.target.files));
      this.$refs.cameraUpload.addEventListener('change', (event) => this.handleFileSelect(event.target.files));
    },

    triggerImageUpload() {
      this.$refs.imageUpload.click();
    },

    triggerCamera() {
      this.$refs.cameraUpload.click();
    },

    handleFileSelect(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file || !file.type.startsWith("image")) {
                continue;
            }
            const index = this.fileMap.size;
            const placeholder = `i${index}:${file.name}`;
            this.fileMap.set(placeholder, file);
            const markdownPlaceholder = `[${file.name}](${placeholder})`;
            this.editor.insert(markdownPlaceholder);
        }
    },

    async checkAuthStatus() {
        this.errorMessage = "";
        try {
            const response = await fetch('/umbraco/api/articulate/authentication/status');
            if (!response.ok) {
                throw new Error('Authentication check failed');
            }
            const data = await response.json();
            if (data.isAuthenticated) {
                this.isAuthenticated = true;
                this.step = "editor";
            } else {
                this.isAuthenticated = false;
                this.step = "login";
            }
        } catch (error) {
            this.isAuthenticated = false;
            this.step = "login";
            this.errorMessage = "Could not verify login status.";
            console.error("Failed to get authentication status:", error);
        }
    },

    async handleLogin() {
        this.submitting = true;
        this.errorMessage = "";
        try {
            const response = await fetch('/umbraco/api/articulate/authentication/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.login)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed.');
            }

            const data = await response.json();
            if (data.requiresTwoFactor) {
                this.errorMessage = "Two-factor authentication is not supported.";
            } else {
                this.isAuthenticated = true;
                this.step = "editor";
            }
        } catch (error) {
            this.errorMessage = error.message;
            this.isAuthenticated = false;
        } finally {
            this.submitting = false;
        }
    },

    async handlePublish() {
        this.submitting = true;
        this.errorMessage = "";

        const formData = new FormData();
        const postData = { ...this.post, files: Array.from(this.fileMap.keys()) };
        formData.append('json', JSON.stringify(postData));

        for (const [key, file] of this.fileMap.entries()) {
            formData.append(key, file);
        }

        try {
            const response = await fetch('/umbraco/api/articulate/editors/markdown/post', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to publish post.');
            }

            const result = await response.json();
            this.successUrl = result.url || '#';
            this.step = 'success';
        } catch (error) {
            this.errorMessage = error.message;
        } finally {
            this.submitting = false;
        }
    }
  }));
});
