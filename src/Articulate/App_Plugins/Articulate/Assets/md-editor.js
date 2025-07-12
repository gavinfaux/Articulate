document.addEventListener("alpine:init", () => {
  const STEPS = Object.freeze({
    LOADING: "loading",
    LOGIN: "login",
    EDITOR: "editor",
    OPTIONAL: "optional",
    SUCCESS: "success",
  });

  Alpine.data("markdownEditor", () => ({
    // --- State & Data (Single Source of Truth) ---
    step: STEPS.LOADING,
    submitting: false,
    isAuthenticated: false,
    fileMap: new Map(),
    editor: null,
    csrfToken: null,
    errors: {},
    login: {
      emailAddress: "",
      password: ""
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

    // --- URLs ---
    authSigninUrl: "",
    authCsrfUrl: "",
    authStatusUrl: "",
    postUrl: "",
    successUrl: "#",
    twoFactorUrl: "",

    // --- GETTERS (All are CSP-compliant) ---
    get caption() {
      switch (this.step) {
        case STEPS.LOGIN: return "User Login";
        case STEPS.EDITOR: return "Create a new post";
        case STEPS.OPTIONAL: return "Optional Details";
        case STEPS.SUCCESS: return "Success!";
        default: return "Loading...";
      }
    },
    get isLoading() { return this.step === STEPS.LOADING || this.submitting; },
    get isLoginStep() { return this.step === STEPS.LOGIN; },
    get isEditorStep() { return this.step === STEPS.EDITOR; },
    get isOptionalStep() { return this.step === STEPS.OPTIONAL; },
    get isSuccessStep() { return this.step === STEPS.SUCCESS; },

    // Getters for data binding
    get loginEmail() { return this.login.emailAddress; },
    get loginPassword() { return this.login.password; },
    get postTitle() { return this.post.title; },
    get postMarkdown() { return this.post.markdown; },
    get postTags() { return this.post.tags; },
    get postCategories() { return this.post.categories; },
    get postExcerpt() { return this.post.excerpt; },
    get postSlug() { return this.post.slug; },

    // Getters for UI state
    get canShowNextButton() { return this.isEditorStep && this.postTitle && this.postMarkdown; },
    get loginButtonText() { return this.submitting ? "Logging in..." : "Login"; },
    get loginErrorClass() { return this.errors.login ? 'is-invalid' : ''; },
    get titleErrorClass() { return this.errors.title ? 'is-invalid' : ''; },
    get showLoginError() { return !!this.errors.login; },
    get loginErrorMessage() { return this.errors.login || ''; },

    // --- METHODS ---
    updateLoginEmail(event) { this.login.emailAddress = event.target.value; if (this.errors.login) this.errors = {}; },
    updateLoginPassword(event) { this.login.password = event.target.value; if (this.errors.login) this.errors = {}; },
    updatePostTitle(event) { this.post.title = event.target.value; if (this.errors.title) this.errors.title = null; },
    updateMarkdownContent() { if (this.editor) this.post.markdown = this.editor.getContent(); },
    updatePostField(event) {
      const field = event.target.id;
      const value = event.target.value;
      if (field && this.post.hasOwnProperty(field)) {
        this.post[field] = value;
      }
    },

    // --- LIFECYCLE & CORE LOGIC ---
    init() {
      this.loadUrlsFromDataset();
      this.getCsrfToken();

      this.$watch("step", () => {
        this.$nextTick(() => {
          if (window.componentHandler) {
            window.componentHandler.upgradeDom();
            if (this.step === STEPS.EDITOR) {
              this.initializeEditor();
            }
          }
        });
      });
    },

    loadUrlsFromDataset() {
      const { authSigninUrl, authCsrfUrl, authStatusUrl, postUrl, articulateNodeId } = document.body.dataset;
      this.authSigninUrl = authSigninUrl;
      this.authCsrfUrl = authCsrfUrl;
      this.authStatusUrl = authStatusUrl;
      this.postUrl = postUrl;
      this.post.articulateNodeId = articulateNodeId;
    },

    initializeEditor() {
      if (this.editor || !this.$refs.editor) return;
      this.editor = new TinyMDE.Editor({
        element: this.$refs.editor,
        content: this.post.markdown,
        commandBar: true,
        autoGrow: true,
        spellChecker: false,
      });
      this.editor.addEventListener("change", this.updateMarkdownContent.bind(this));
    },

    async _fetchCsrfToken() {
      const response = await fetch(this.authCsrfUrl);
      if (!response.ok) throw new Error(`CSRF token fetch failed: ${response.status}`);
      const data = await response.json();
      this.csrfToken = data.requestToken;
    },

    async getCsrfToken() {
      try {
        await this._fetchCsrfToken();
        await this.checkAuthStatus();
      } catch (error) {
        console.error("A security token could not be loaded. Please refresh the page.", error);
        this.step = STEPS.LOGIN;
      }
    },

    async checkAuthStatus() {
      if (!this.authStatusUrl) return;
      try {
        const response = await fetch(this.authStatusUrl);
        if (response.status === 401) {
          this.isAuthenticated = false;
          this.step = STEPS.LOGIN;
          return;
        }
        if (!response.ok) throw new Error(`Auth status check failed: ${response.status}`);
        const result = await response.json();
        this.isAuthenticated = result.isAuthenticated;
        this.step = this.isAuthenticated ? STEPS.EDITOR : STEPS.LOGIN;
      } catch (error) {
        console.warn("Could not verify login status.", error);
        this.step = STEPS.LOGIN;
      }
    },

    async handleLogin() {
      this.errors = {};
      if (!this.login.emailAddress || !this.login.password) {
        this.errors = { login: 'Invalid username or password, please try again' };
        return;
      }
      this.submitting = true;
      try {
        await this._fetchCsrfToken();
        const response = await fetch(this.authSigninUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "RequestVerificationToken": this.csrfToken },
          body: JSON.stringify(this.login),
        });
        if (!response.ok) {
          this.errors = { login: 'Invalid username or password, please try again' };
          return;
        }
        const result = await response.json();
        if (result.requiresTwoFactor) {
          this.twoFactorUrl = result.redirectUrl;
        } else {
          await this._fetchCsrfToken();
          this.isAuthenticated = true;
          this.step = STEPS.EDITOR;
        }
      } catch (error) {
        console.error("An error occurred during login:", error);
        this.errors = { login: 'An unexpected error occurred.' };
      } finally {
        this.submitting = false;
      }
    },

    triggerImageUpload() { this.$refs.imageUpload.click(); },
    triggerCamera() { this.$refs.cameraUpload.click(); },
    goToEditorStep() { this.step = STEPS.EDITOR; },
    goToOptionalStep() { this.step = STEPS.OPTIONAL; },

    resetForNewPost() {
      this.post = { ...this.post, title: "", markdown: "", tags: "", categories: "", published: new Date().toISOString().slice(0, 16), excerpt: "", slug: "" };
      this.fileMap.clear();
      if (this.editor) this.editor.setContent("");
      this.step = STEPS.EDITOR;
    },

    handleFileSelect(event) {
      const files = event.target.files;
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];
      for (const file of files) {
        if (!file || !ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) continue;
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "");
        if (sanitizedName.length === 0 || sanitizedName.length > 255) continue;
        const index = this.fileMap.size;
        const placeholderUrl = `tmp:${index}:${sanitizedName}`;
        this.fileMap.set(placeholderUrl, file);
        this.editor.paste(`![${sanitizedName}](${placeholderUrl})`);
      }
    },

    async handlePublish() {
      this.submitting = true;
      try {
        await this._fetchCsrfToken();
        const formData = new FormData();
        formData.append("json", JSON.stringify(this.post));
        for (const [key, file] of this.fileMap.entries()) {
          formData.append(key, file);
        }
        const response = await fetch(this.postUrl, {
          method: "POST",
          headers: { "RequestVerificationToken": this.csrfToken },
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Publish request failed: ${response.status}`);
        }
        const result = await response.json();
        this.successUrl = result.url || "#";
        this.step = STEPS.SUCCESS;
      } catch (error) {
        console.error("Failed to publish post:", error);
        this.step = STEPS.OPTIONAL;
      } finally {
        this.submitting = false;
      }
    },
  }));
});
