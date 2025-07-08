document.addEventListener("alpine:init", () => {
Alpine.data("app", () => ({
  // --- State Management ---
  step: "loading",
  isEditorInitializing: false,
  isAuthenticated: false,
  submitting: false,
  errorMessage: "",
  successUrl: "#",
  caption: "Create a new post",
  fileMap: new Map(),
  editor: null,
  csrfToken: null,
  authSigninUrl: "",
  authSignoutUrl: "",
  authCsrfUrl: "",
  authStatusUrl: "",
  postUrl: "",

  // --- Models  ---
  login: {
    emailAddress: "",
    password: "",
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

  async init() {
    console.info("Alpine component initializing...");

    const bodyEl = document.body;
    this.authSigninUrl = bodyEl.dataset.authSigninUrl;
    this.authSignoutUrl = bodyEl.dataset.authSignoutUrl;
    this.authCsrfUrl = bodyEl.dataset.authCsrfUrl;
    this.authStatusUrl = bodyEl.dataset.authStatusUrl;
    this.postUrl = bodyEl.dataset.postUrl;
    this.post.articulateNodeId = bodyEl.dataset.articulateNodeId;

    await this.getCsrfToken();
    if (this.csrfToken) {
      await this.checkAuthStatus();
    }

    this.$watch("step", (newStep) => {
      if (newStep === "editor" && !this.editor && !this.isEditorInitializing) {
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
      }
    });
  },

  // fetch the CSRF token from the API
  async getCsrfToken() {
    try {
      const response = await fetch(this.authCsrfUrl);
      if (!response.ok) throw new Error('Could not fetch CSRF token');
      const data = await response.json();
      this.csrfToken = data.requestToken;
    } catch (error) {
      this.errorMessage = "A security token could not be loaded. Please refresh the page.";
      // fallback to login on error
      this.step = 'login';
    }
  },

  triggerImageUpload() {
    this.$refs.imageUpload.click();
  },

  triggerCamera() {
    this.$refs.cameraUpload.click();
  },

  handleFileSelect(files) {
    for (const file of files) {
      if (!file || !file.type.startsWith("image")) continue;

      const index = this.fileMap.size;

      // 1. Create the unique, temporary placeholder URL.
      const placeholderUrl = `tmp:${index}:${file.name}`;

      // 2. Use this placeholder as the key in our map.
      this.fileMap.set(placeholderUrl, file);

      // 3. Insert standard Markdown syntax into the editor.
      const markdownToInsert = `![${file.name}](${placeholderUrl})`;
      this.editor.paste(markdownToInsert);
}
  },

  async checkAuthStatus() {
    this.errorMessage = "";
    try {
      const response = await fetch(this.authStatusUrl);
      if (!response.ok) throw new Error('Authentication check failed');
      const data = await response.json();
      this.step = data.isAuthenticated ? "editor" : "login";
    } catch (error) {
      this.step = "login";
      this.errorMessage = "Could not verify login status.";
    }
  },

  async handleLogin() {
    this.submitting = true;
    this.errorMessage = "";
    try {
      const response = await fetch(this.authSigninUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RequestVerificationToken': this.csrfToken // Send the token
        },
        body: JSON.stringify(this.login)
      });

      if (!response.ok) throw new Error('Login failed. Please check your credentials.');

      this.isAuthenticated = true;
      this.step = "editor";
    } catch (error) {
      this.errorMessage = error.message;
    } finally {
      this.submitting = false;
    }
  },

  async handlePublish() {
    this.submitting = true;
    this.errorMessage = "";

    const formData = new FormData();
    formData.append('json', JSON.stringify(this.post));

    for (const [key, file] of this.fileMap.entries()) {
      // The 'key' will be "tmp:0:my-cat.jpg"
      // The 'file' will be the actual file data
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

      if (!response.ok) throw new Error('Failed to publish post.');

      const result = await response.json();
      this.successUrl = result.url || '#';
      this.step = 'success';
    } catch (error) {
      this.errorMessage = error.message;
      this.step = 'optional';
    } finally {
      this.submitting = false;
    }
  }
}));
});
