// TODO: Use Management API authentication endpoints. Get/refresh bearer token, login via backoffice ui.

document.addEventListener("alpine:init", () => {
  const STEPS = Object.freeze({
    LOADING: "loading",
    LOGIN: "login",
    EDITOR: "editor",
    OPTIONAL: "optional",
    SUCCESS: "success"
  });

  window.Alpine.data("markdownEditor", () => ({
    // --- State & Data
    step: STEPS.LOADING,
    submitting: false,
    isAuthenticated: false,
    fileMap: new Map(),
    editor: null,
    errors: {},
    touched: {
      //email: false,
      //password: false,
      title: false
    },
    //login: {
    //  emailAddress: "",
    //  password: ""
    //},
    post: {
      articulateNodeId: "",
      title: "",
      markdown: "",
      author: "",
      tags: "",
      categories: "",
      published: new Date().toISOString().slice(0, 16),
      excerpt: "",
      slug: ""
    },

    // --- URLs ---
    authUrl: "",
    authEndUrl: "",
    tokenUrl: "",
    currentUserUrl: "",
    editorPostUrl: "",
    twoFactorUrl: "",

    // --- GETTERS (CSP-compliant) ---
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
    // refactor:     get loginEmail() { return this.login.emailAddress; },
    // refactor:     get loginPassword() { return this.login.password; },
    get postTitle() { return this.post.title; },
    get postMarkdown() { return this.post.markdown; },
    get postTags() { return this.post.tags; },
    get postCategories() { return this.post.categories; },
    get postExcerpt() { return this.post.excerpt; },
    get postSlug() { return this.post.slug; },

    // Getters for UI state
    get canShowNextButton() { return (this.isEditorStep && this.postTitle && this.postMarkdown) || this.isOptionalStep; },
    get loginButtonText() { return this.submitting ? "Logging in..." : "Login"; },

    //get loginEmailErrorClass() {
    //  const hasServerError = !!this.errors.login;
    //  const isDirtyAndInvalid = this.touched.email && !this.login.emailAddress;
    //  return (hasServerError || isDirtyAndInvalid) ? "is-dirty-invalid" : "";
    //},
    //get loginPasswordErrorClass() {
    //  const hasServerError = !!this.errors.login;
    //  const isDirtyAndInvalid = this.touched.password && !this.login.password;
    //  return (hasServerError || isDirtyAndInvalid) ? "is-dirty-invalid" : "";
    //},

    // TODO: refactor: custom validation ux not really needed now login ux is gone
    get titleErrorClass() {
      const hasServerError = !!this.errors.title;
      const isDirtyAndInvalid = this.touched.title && !this.post.title;
      return (hasServerError || isDirtyAndInvalid) ? "is-dirty-invalid" : "";
    },
    //get showLoginError() { return !!this.errors.login; },
    //get loginErrorMessage() { return this.errors.login || ""; },
    get showAppError() { return !!this.errors.app; },
    get appErrorMessage() { return this.errors.app || ""; },

    // --- METHODS ---
    //updateLoginEmail(event) { this.login.emailAddress = event.target.value; if (this.errors.login) this.errors = {}; },
    //updateLoginPassword(event) { this.login.password = event.target.value; if (this.errors.login) this.errors = {}; },
    updatePostTitle(event) { this.post.title = event.target.value; if (this.errors.title) this.errors.title = null; },
    updateMarkdownContent() { if (this.editor) this.post.markdown = this.editor.getContent(); },
    updatePostField(event) {
      const field = event.target.id;
      const value = event.target.value;
      if (field && this.post.hasOwnProperty(field)) {
        this.post[field] = value;
      }
    },
  //  handleBlur(event) {
  //    const fieldId = event.target.id;
  //    if (this.touched.hasOwnProperty(fieldId)) {
  //      this.touched[fieldId] = true;
  //    }
  //},

    // --- LIFECYCLE & CORE LOGIC ---
    init() {
      if (!this.loadUrlsFromDataset()) {
        return;
      }
      // refactor: this.checkAuthStatus();
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
      this.errors = {};
      const { authUrl, authEndUrl, tokenUrl, currentUserUrl, editorPostUrl, articulateNodeId } = document.body.dataset;
      if (!authUrl || !editorPostUrl || !currentUserUrl || !tokenUrl || !authEndUrl || !articulateNodeId) {
        this.errors = { app: "CRITICAL: One or more dataset values missing. The application cannot function." };
        return false;
      }      this.authUrl = authUrl;
      this.authEndUrl = authEndUrl;
      this.tokenUrl = tokenUrl;
      this.currentUserUrl = currentUserUrl;
      this.editorPostUrl = editorPostUrl;
      this.post.articulateNodeId = articulateNodeId;
      return true;
    },

    initializeEditor() {
      if (this.editor || !this.$refs.editor) return;
      this.editor = new TinyMDE.Editor({
        element: this.$refs.editor,
        content: this.post.markdown,
        commandBar: false,
        autoGrow: true,
        spellChecker: true
      });
      this.editor.addEventListener("change", this.updateMarkdownContent.bind(this));
    },

    // TODO: not required or check current user url
    //async checkAuthStatus() {
    //  try {
    //    const response = await fetch(this.authStatusUrl, {
    //      method: "GET",
    //      headers: { "Accept": "application/json" },
    //      credentials: "include"
    //    });
    //    if (response.status === 401) {
    //      this.isAuthenticated = false;
    //      this.step = STEPS.LOGIN;
    //      return;
    //    };
    //    if (!response.ok) {
    //      throw new Error(`Server error: ${response.status}`);
    //    };
    //    this.isAuthenticated = true;
    //    this.step = STEPS.EDITOR;
    //    return;
    //  } catch (error) {
    //    console.warn("Could not verify login status.", error);
    //    this.step = STEPS.LOGIN;
    //  }
    //},

    // TODO: use management api get a token
    //async handleLogin() {
    //  this.errors = {};
    //  if (!this.login.emailAddress || !this.login.password) {
    //    this.errors = { login: "Invalid username or password, please try again" };
    //    return;
    //  }
    //  this.submitting = true;
    //  try {
    //    const response = await fetch(this.authLoginUrl, {
    //      method: "POST",
    //      headers: { "Accept": "application/json", "Content-Type": "application/json" },
    //      body: JSON.stringify(this.login),
    //      credentials: "include"
    //    });
    //    if (!response.ok) {
    //      this.errors = { login: "Invalid username or password, please try again" };
    //      this.touched.email = true;
    //      this.touched.password = true;
    //      return;
    //    }
    //    const result = await response.json();
    //    if (result.requiresTwoFactor) {
    //      this.twoFactorUrl = result.redirectUrl;
    //    } else {
    //      this.isAuthenticated = true;
    //      this.step = STEPS.EDITOR;
    //    }
    //  } catch (error) {
    //    console.error("An error occurred during login:", error);
    //    this.errors = { login: "An unexpected error occurred. Try refreshing the page and try again." };
    //  } finally {
    //    this.submitting = false;
    //  }
    //},

    // TODO: management api end session
    //async handleLogout() {
    //  try {
    //    await fetch(this.authLogoutUrl, {
    //      method: "POST",
    //      headers: {
    //        "Accept": "application/json"
    //      },
    //      credentials: "include"
    //    });
    //    this.isAuthenticated = false;
    //    this.step = STEPS.LOGIN;
    //  } catch (error) {
    //    console.error("Logout failed:", error);
    //  }
    //},

    triggerImageUpload() { this.$refs.imageUpload.click(); },
    triggerCamera() { this.$refs.cameraUpload.click(); },
    goToEditorStep() { this.step = STEPS.EDITOR; },
    goToOptionalStep() { if (this.step === STEPS.OPTIONAL) { this.handlePublish(); } else { this.step = STEPS.OPTIONAL; } },

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
      this.errors = {};
      this.submitting = true;
      try {
        const formData = new FormData();
        formData.append("json", JSON.stringify(this.post));
        for (const [key, file] of this.fileMap.entries()) {
          formData.append(key, file);
        }
        const response = await fetch(this.postUrl, {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: formData,
          credentials: "include"
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Publish request failed: ${response.status}`);
        }
        this.step = STEPS.SUCCESS;
      } catch (error) {
        console.error("Failed to publish post:", error);
        this.errors = { app: "An unexpected error occurred. Try refreshing the page and try again." };
        this.step = STEPS.OPTIONAL;
      } finally {
        this.submitting = false;
      }
    }
  }));
});
