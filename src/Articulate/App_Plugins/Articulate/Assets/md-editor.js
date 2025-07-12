document.addEventListener("alpine:init", () => {
  const STEPS = Object.freeze({
    LOADING: "loading",
    LOGIN: "login",
    EDITOR: "editor",
    OPTIONAL: "optional",
    SUCCESS: "success",
  });

  Alpine.data("markdownEditor", () => ({
    // --- State Management ---
    step: STEPS.LOADING,
    submitting: false,
    isAuthenticated: false,
    fileMap: new Map(),
    editor: null,
    csrfToken: null,
    get caption() {
      switch (this.step) {
        case STEPS.LOGIN:
          return "User Login";
        case STEPS.EDITOR:
          return "Create a new post";
        case STEPS.OPTIONAL:
          return "Optional Details";
        case STEPS.SUCCESS:
          return "Success!";
        default:
          return "Loading...";
      }
    },
    errors: {},

    // --- URLs ---
    authSigninUrl: "",
    authCsrfUrl: "",
    authStatusUrl: "",
    postUrl: "",
    successUrl: "#",
    twoFactorUrl: "",

    // --- Models ---
    login: {
      emailAddress: null,
      password: null,
    },

    updateLoginEmail() {
      this.login.emailAddress = this.$refs.emailInput.value;
      if (this.isLoginError) {
        this.isLoginError = false;
        this.$refs.emailInput.parentElement.classList.remove("is-invalid");
        this.$refs.passwordInput.parentElement.classList.remove("is-invalid");
      }
    },

    updateLoginPassword() {
      this.login.password = this.$refs.passwordInput.value;
      if (this.isLoginError) {
        this.isLoginError = false;
        this.$refs.emailInput.parentElement.classList.remove("is-invalid");
        this.$refs.passwordInput.parentElement.classList.remove("is-invalid");
      }
    },

    updatePostField(event) {
      if (!event.target) return;
      const field = event.target.id;
      const value = event.target.value;
      if (field && this.post.hasOwnProperty(field)) {
        this.post[field] = value;
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
    post: { title: '' },
    login: { emailAddress: null, password: null },


    // --- Getters for UI State ---
    get loginEmail() {
      return this.login.emailAddress;
    },
    get loginPassword() {
      return this.login.password;
    },
    get isLoading() {
      return this.step === STEPS.LOADING || this.submitting;
    },
    get isLoginStep() {
      return this.step === STEPS.LOGIN;
    },
    get isEditorStep() {
      return this.step === STEPS.EDITOR;
    },
    get isOptionalStep() {
      return this.step === STEPS.OPTIONAL;
    },
    get isSuccessStep() {
      return this.step === STEPS.SUCCESS;
    },
    get canShowNextButton() {
      return this.isEditorStep && this.post.title && this.post.markdown;
    },
    get loginErrorClass() {
      return this.errors.login ? 'is-invalid' : '';
    },
    // --- NEW Getters for Error Visibility and Text ---
    get showLoginError() {
      // Must return a simple boolean
      return !!this.errors.login;
    },
    get loginErrorMessage() {
      // Must return a simple string
      return this.errors.login || '';
    },
    get postTitle() {
      return this.post.title;
    },

    updatePostTitle(event) {
      this.post.title = event.target.value;
      // Clear any previous title error when user starts typing
      if (this.errors.title) {
        this.errors.title = null;
      }
    },

    // Make sure your updatePostField method is still there for the optional fields
    updatePostField(event) {
      if (!event.target) return;
      const field = event.target.id;
      const value = event.target.value;
      if (field && this.post.hasOwnProperty(field)) {
        this.post[field] = value;
      }
    },
    get titleErrorClass() {
      return this.errors.title ? 'is-invalid' : '';
    },
    get loginButtonText() {
      return this.submitting ? "Logging in..." : "Login";
    },
    // --- NEW: Methods to safely UPDATE nested values from the view ---
    updateLoginEmail(event) {
      this.login.emailAddress = event.target.value;
      if (this.errors.login) this.errors = {}; // Clear error on new input
    },
    updateLoginPassword(event) {
      this.login.password = event.target.value;
      if (this.errors.login) this.errors = {}; // Clear error on new input
    },
  
    // --- Initialization & Lifecycle ---
    init() {
      this.loadUrlsFromDataset();
      this.getCsrfToken();

      this.$nextTick(() => {
        if (window.componentHandler) {
          const layout = document.querySelector(".mdl-js-layout");
          if (layout) window.componentHandler.upgradeElement(layout);
        }
      });

      this.$watch("step", (value) => {
        this.$nextTick(() => {
          if (window.componentHandler) {
            let container = null;
            switch (value) {
              case STEPS.LOGIN:
                container = this.$refs.loginView;
                break;
              case STEPS.EDITOR:
                container = this.$refs.editorView;
                break;
              case STEPS.OPTIONAL:
                container = this.$refs.optionalView;
                break;
              case STEPS.SUCCESS:
                container = this.$refs.successView;
                break;
            }

            if (container) {
              window.componentHandler.upgradeDom();
            }

            // Always ensure the FABs are upgraded if they are visible
            window.componentHandler.upgradeDom();

            if (value === STEPS.EDITOR) {
              this.initializeEditor();
            }
          }
        });
      });

      // Return a cleanup function for when the component is destroyed
      return () => {
        if (this.editor) {
          this.editor.removeEventListener("change", this.updateMarkdownContent);
        }
      };
    },

    loadUrlsFromDataset() {
      const {
        authSigninUrl,
        authCsrfUrl,
        authStatusUrl,
        postUrl,
        articulateNodeId,
      } = document.body.dataset;
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
        commandBar: false,
        autoGrow: true,
        spellChecker: false,
        content: ""
      });

      this.editor.addEventListener(
        "change",
        this.updateMarkdownContent.bind(this)
      );
    },

    updateMarkdownContent() {
      if (!this.editor) return;
      this.post.markdown = this.editor.getContent();
    },

    // --- Authentication Flow ---
    async _fetchCsrfToken() {
      const response = await fetch(this.authCsrfUrl);
      if (!response.ok)
        throw new Error(`CSRF token fetch failed: ${response.status}`);
      const data = await response.json();
      this.csrfToken = data.requestToken;
    },

    async getCsrfToken() {
      try {
        await this._fetchCsrfToken();
        await this.checkAuthStatus();
      } catch (error) {
        console.error(
          "A security token could not be loaded. Please refresh the page.",
          error
        );
        this.step = STEPS.LOGIN; // Fallback to login
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
        if (!response.ok)
          throw new Error(`Auth status check failed: ${response.status}`);

        const result = await response.json();
        this.isAuthenticated = result.isAuthenticated;
        this.step = this.isAuthenticated ? STEPS.EDITOR : STEPS.LOGIN;
      } catch (error) {
        console.warn("Could not verify login status.", error);
        this.step = STEPS.LOGIN;
      }
    },

    // Replace the entire handleLogin function with this

    async handleLogin() {
      // 1. Clear previous errors
      this.errors = {};

      // 2. Validate using the reactive data model
      if (!this.login.emailAddress || !this.login.password) {
        // Set the error state; the UI will react automatically
        this.errors = { login: 'Invalid username or password, please try again' };
        return;
      }

      this.submitting = true;
      try {
        await this._fetchCsrfToken();

        const response = await fetch(this.authSigninUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "RequestVerificationToken": this.csrfToken,
          },
          body: JSON.stringify(this.login),
        });

        if (!response.ok) {
          // On failure, just set the error state. The UI will update.
          this.errors = { login: 'Invalid username or password, please try again' };
          console.warn(`Login failed with status ${response.status}.`);
          return;
        }

        const result = await response.json();
        if (result.requiresTwoFactor) {
          this.twoFactorUrl = result.redirectUrl;
        } else {
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
    // --- UI Actions & Navigation ---
    triggerImageUpload() {
      this.$refs.imageUpload.click();
    },

    triggerCamera() {
      this.$refs.cameraUpload.click();
    },

    goToEditorStep() {
      this.step = STEPS.EDITOR;
    },

    goToOptionalStep() {
      this.step = STEPS.OPTIONAL;
    },

    resetForNewPost() {
      this.post = {
        ...this.post, // Keep articulateNodeId
        title: "",
        markdown: "",
        tags: "",
        categories: "",
        published: new Date().toISOString().slice(0, 16),
        excerpt: "",
        slug: "",
        isLoginError: false,
        errors: {}, // { title: 'Title is required.', login: '...' },
        post: { title: '' },
        login: { emailAddress: null, password: null },
      };
      this.fileMap.clear();
      if (this.editor) {
        this.editor.setContent("");
      }
      this.step = STEPS.EDITOR;
    },
    validate() {
      const newErrors = {};
      if (!this.post.title) {
        newErrors.title = 'Title is required.';
      }
      this.errors = { ...this.errors, ...newErrors };
      return !newErrors.title; // Return true if this part is valid
    },


    // --- File Handling & Publishing ---
    handleFileSelect(event) {
      const files = event.target.files;
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];

      for (const file of files) {
        if (!file) continue;

        if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
          console.warn(`Rejected file: ${file.name}. Invalid type or size.`);
          continue;
        }

        // Basic sanitization
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "");
        if (sanitizedName.length === 0 || sanitizedName.length > 255) {
          console.warn(
            `Rejected file: Invalid filename after sanitization - ${file.name}`
          );
          continue;
        }

        const index = this.fileMap.size;
        const placeholderUrl = `tmp:${index}:${sanitizedName}`;
        this.fileMap.set(placeholderUrl, file);

        const markdownToInsert = `![${sanitizedName}](${placeholderUrl})`;
        this.editor.paste(markdownToInsert);
      }
    },

    async handlePublish() {
      if (!this.validatePost()) {
        return; // Abort if validation fails
      }

      this.submitting = true;

      try {
        // Fetch a fresh token right before posting to prevent stale token errors.
        await this._fetchCsrfToken();

        const formData = new FormData();
        formData.append("json", JSON.stringify(this.post));
  
        for (const [key, file] of this.fileMap.entries()) {
          formData.append(key, file);
        }
        const response = await fetch(this.postUrl, {
          method: "POST",
          headers: {
            RequestVerificationToken: this.csrfToken,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || `Publish request failed: ${response.status}`
          );
        }

        const result = await response.json();
        this.successUrl = result.url || "#";
        this.step = STEPS.SUCCESS;
      } catch (error) {
        console.error("Failed to publish post:", error);
        this.step = STEPS.OPTIONAL; // Return to optional step on failure
      } finally {
        this.submitting = false;
      }
    },
  }));
});
