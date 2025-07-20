(function () {
  'use strict';

  // --- Encapsulated Helper Functions and Constants ---
  // Note: All 'export' keywords have been removed. These are now private
  // to this script's scope and used by the Alpine component below.

  const STEPS = {
    LOADING: 'loading',
    LOGIN: 'login',
    EDITOR: 'editor',
    OPTIONAL: 'optional',
    SUCCESS: 'success'
  };

  const CODE_VERIFIER_STORAGE_KEY = 'articulate_spa_code_verifier';

  /**
   * Generates a secure, random string for the code verifier.
   */
  function generateCodeVerifier() {
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    const codeVerifier = btoa(String.fromCharCode.apply(null, Array.from(randomBytes)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return codeVerifier;
  }

  /**
   * Hashes the code verifier using SHA-256 to create the code challenge.
   */
  async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const codeChallenge = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(hashBuffer))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return codeChallenge;
  }

  const TOKEN_STORAGE_KEY = 'articulate_spa_token_response';

  const tokenManager = {
    /**
     * Saves the full token response from the Umbraco token endpoint to localStorage.
     */
    saveTokenResponse(tokenResponse) {
      const tokenWithTimestamp = { ...tokenResponse, issued_at: Date.now() };
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenWithTimestamp));
    },

    /**
     * Retrieves the stored token response object from localStorage.
     */
    getTokenResponse() {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    },

    /**
     * Clears all token data from localStorage.
     */
    clearTokens() {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    },

    /**
     * Checks if the access token is expired or close to expiring.
     */
    isTokenExpired() {
      const token = this.getTokenResponse();
      if (!token) return true;
      const expiryTime = token.issued_at + ((token.expires_in - 60) * 1000);
      return Date.now() > expiryTime;
    },

    /**
     * The main public method. Returns a valid access token, refreshing if necessary.
     */
    async getValidAccessToken() {
      const token = this.getTokenResponse();
      if (!token) {
        return null;
      }

      if (!this.isTokenExpired()) {
        return token.access_token;
      }

      try {
        const body = new URLSearchParams();
        body.append('grant_type', 'refresh_token');
        body.append('client_id', 'umbraco-back-office');
        body.append('refresh_token', token.refresh_token);

        const response = await fetch('/umbraco/management/api/v1/security/back-office/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body,
        });

        if (!response.ok) {
          throw new Error("Refresh token was rejected by the server.");
        }

        const newTokens = await response.json();
        this.saveTokenResponse(newTokens);
        return newTokens.access_token;

      } catch (error) {
        console.error("Could not refresh token. Forcing logout.", error);
        this.clearTokens();
        return null;
      }
    }
  };


  // --- Alpine.js Component Definition ---

  document.addEventListener("alpine:init", () => {
    // Note: Assumes 'Alpine' is available on the window object from a CDN script.
    window.Alpine.data("markdownEditor", () => ({

      // --- State & Data
      step: STEPS.LOADING,
      submitting: false,
      isAuthenticated: false,
      fileMap: new Map(),
      editor: null,
      errors: {},
      touched: {
        title: false
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
        slug: ""
      },

      // --- URLs ---
      authUrl: "",
      authEndUrl: "",
      tokenUrl: "",
      currentUserUrl: "",
      editorPostUrl: "",

      // --- GETTERS ---
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
      get postTitle() { return this.post.title; },
      get postMarkdown() { return this.post.markdown; },
      get postTags() { return this.post.tags; },
      get postCategories() { return this.post.categories; },
      get postExcerpt() { return this.post.excerpt; },
      get postSlug() { return this.post.slug; },
      get canShowNextButton() { return (this.isEditorStep && !!this.post.title && !!this.post.markdown) || this.isOptionalStep; },
      get titleErrorClass() {
        const hasServerError = !!this.errors.title;
        const isDirtyAndInvalid = this.touched.title && !this.post.title;
        return (hasServerError || isDirtyAndInvalid) ? "is-dirty-invalid" : "";
      },
      get showAppError() { return !!this.errors.app; },
      get appErrorMessage() { return this.errors.app || ""; },

      // --- METHODS ---
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
        if (!this.loadUrlsFromDataset()) {
          this.step = STEPS.LOGIN;
          return;
        }

        this.checkSession();

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
        }
        this.authUrl = authUrl;
        this.authEndUrl = authEndUrl;
        this.tokenUrl = tokenUrl;
        this.currentUserUrl = currentUserUrl;
        this.editorPostUrl = editorPostUrl;
        this.post.articulateNodeId = articulateNodeId;
        return true;
      },

      initializeEditor() {
        if (this.editor || !this.$refs.editor) return;
        // Note: Assumes 'TinyMDE' is available on the window object from a CDN script.
        this.editor = new window.TinyMDE.Editor({
          element: this.$refs.editor,
          content: this.post.markdown
        });
        this.editor.addEventListener("change", this.updateMarkdownContent.bind(this));
      },

      async checkSession() {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');

        if (authCode) {
          await this.handleLoginCallback(authCode);
          return;
        }

        const accessToken = await tokenManager.getValidAccessToken();
        if (accessToken) {
          this.isAuthenticated = true;
          this.step = STEPS.EDITOR;
        } else {
          this.isAuthenticated = false;
          this.step = STEPS.LOGIN;
        }
      },

      async redirectToLogin() {
        this.errors.app = null;
        try {
          const codeVerifier = generateCodeVerifier();
          const state = Math.random().toString(36).substring(2);

          sessionStorage.setItem(CODE_VERIFIER_STORAGE_KEY, codeVerifier);
          sessionStorage.setItem('oauth_state', state);

          const codeChallenge = await generateCodeChallenge(codeVerifier);

          const params = new URLSearchParams({
            client_id: 'umbraco-back-office',
            redirect_uri: window.location.origin + window.location.pathname,
            response_type: 'code',
            scope: 'umbraco-api',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: state
          });

          window.location.href = `${this.authUrl}?${params.toString()}`;
        } catch (error) {
          console.error("Failed to redirect to login:", error);
          this.errors.app = "Could not initiate login. Please try again.";
        }
      },

      async handleLoginCallback(authCode) {
        this.step = STEPS.LOADING;
        this.errors.app = null;

        const urlParams = new URLSearchParams(window.location.search);
        const returnedState = urlParams.get('state');
        const storedState = sessionStorage.getItem('oauth_state');

        if (returnedState !== storedState) {
            this.errors.app = "Invalid state parameter. Aborting login.";
            this.step = STEPS.LOGIN;
            return;
        }

        const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_STORAGE_KEY);

        if (!codeVerifier) {
          this.errors.app = "Login session expired or is invalid. Please try again.";
          this.step = STEPS.LOGIN;
          return;
        }

        try {
          const body = new URLSearchParams();
          body.append('grant_type', 'authorization_code');
          body.append('client_id', 'umbraco-back-office');
          body.append('code', authCode);
          body.append('redirect_uri', window.location.origin + window.location.pathname);
          body.append('code_verifier', codeVerifier);

          const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body,
          });

          if (!response.ok) {
            throw new Error('Failed to exchange authorization code for token.');
          }

          const tokenResponse = await response.json();
          tokenManager.saveTokenResponse(tokenResponse);

          sessionStorage.removeItem(CODE_VERIFIER_STORAGE_KEY);
          window.history.replaceState({}, document.title, window.location.pathname);

          this.isAuthenticated = true;
          this.step = STEPS.EDITOR;

        } catch (error) {
          console.error("Token exchange failed:", error);
          this.errors.app = "Login failed. Please try again.";
          this.step = STEPS.LOGIN;
        }
      },

      handleLogout() {
        tokenManager.clearTokens();
        sessionStorage.removeItem(CODE_VERIFIER_STORAGE_KEY);
        this.isAuthenticated = false;
        this.step = STEPS.LOGIN;
        if (this.authEndUrl) {
          window.location.href = this.authEndUrl;
        }
      },

      triggerImageUpload() { this.$refs.imageUpload?.click(); },
      triggerCamera() { this.$refs.cameraUpload?.click(); },
      goToEditorStep() { this.step = STEPS.EDITOR; },
      goToOptionalStep() { if (this.step === STEPS.OPTIONAL) { this.handlePublish(); } else { this.step = STEPS.OPTIONAL; } },

      resetForNewPost() {
        this.post = { ...this.post, title: "", markdown: "", tags: "", categories: "", published: new Date().toISOString().slice(0, 16), excerpt: "", slug: "" };
        this.fileMap.clear();
        if (this.editor) {
          this.editor.setContent("");
        }
        this.step = STEPS.EDITOR;
      },

      handleFileSelect(event) {
        const files = event.target.files;
        if (!files) return;
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];
        for (const file of Array.from(files)) {
          if (!file || !ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) continue;
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "");
          if (sanitizedName.length === 0 || sanitizedName.length > 255) continue;
          const index = this.fileMap.size;
          const placeholderUrl = `tmp:${index}:${sanitizedName}`;
          this.fileMap.set(placeholderUrl, file);
          if (this.editor) {
            this.editor.paste(`![${sanitizedName}](${placeholderUrl})`);
          }
        }
      },

      async handlePublish() {
        this.errors = {};
        this.submitting = true;
        try {
          const token = await tokenManager.getValidAccessToken();
          if (!token) {
            this.errors.app = "Your session has expired. Please login again.";
            this.step = STEPS.LOGIN;
            this.isAuthenticated = false;
            return;
          }

          const formData = new FormData();
          formData.append("json", JSON.stringify(this.post));
          for (const [key, file] of this.fileMap.entries()) {
            formData.append(key, file);
          }
          const response = await fetch(this.editorPostUrl, {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: formData,
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

}());
