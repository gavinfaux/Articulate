import { Authentication, MarkdownEditor } from "./api/sdk.gen";
import type { Editor } from "@milkdown/kit/core";
import type { ProblemDetails } from "./api/types.gen";

import "@picocss/pico";
import Alpine from "alpinejs";

declare global {
  interface Window {
    Alpine: typeof Alpine;
    alpineInitialized?: boolean;
  }
}

window.Alpine = Alpine;

function isProblemDetails(obj: any): obj is ProblemDetails {
  return obj && typeof obj === "object" && ("title" in obj || "detail" in obj);
}

// Add a guard to prevent double initialization from HMR in dev environments
if (!window.alpineInitialized) {
  window.alpineInitialized = true;

  document.addEventListener("alpine:init", () => {
    Alpine.data("app", () => ({
      // --- State Management ---
      step: "loading", // 'loading', 'login', 'editor', 'optional', 'success'
      isAuthenticated: false,
      submitting: false,
      errorMessage: "",
      successUrl: "#",
      caption: "Create a new post",
      fileMap: new Map<string, File>(),
      editor: null as Editor | null,
      editorInitialized: false,

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

        this.$watch("step", (newStep, oldStep) => {
          console.info(`State changed: step transitioned from ${oldStep} to ${newStep}`);
          if (newStep === "editor") {
            if (this.editorInitialized) {
              console.info("Editor creation already in progress or completed. Skipping.");
              return;
            }
            this.editorInitialized = true;
            console.info("Step is 'editor', attempting to initialize Milkdown...");
            this.$nextTick(async () => {
              if (this.$refs.editor) {
                console.info("Found editor element via x-ref. Creating editor instance...");
                try {
                  const { Editor, defaultValueCtx, rootCtx } = await import("@milkdown/kit/core");
                  const { commonmark } = await import("@milkdown/kit/preset/commonmark");
                  const { history } = await import("@milkdown/kit/plugin/history");
                  const { listener, listenerCtx } = await import("@milkdown/kit/plugin/listener");
                  const { upload, uploadConfig } = await import("@milkdown/kit/plugin/upload");

                  const editorInstance = await Editor.make()
                    .config((ctx) => {
                      ctx.set(rootCtx, this.$refs.editor);
                      ctx.set(defaultValueCtx, this.post.markdown);
                      ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
                        this.post.markdown = markdown;
                      });
                      const config = ctx.get(uploadConfig.key);
                      ctx.set(uploadConfig.key, {
                        ...config,
                        uploader: this.uploader.bind(this),
                      });
                    })
                    .use(commonmark)
                    .use(history)
                    .use(listener)
                    .use(upload)
                    .create();
                  this.editor = editorInstance;
                  console.info("Milkdown editor created successfully.");
                } catch (e) {
                  console.error("Failed to create Milkdown editor:", e);
                  this.errorMessage = "Failed to load the editor.";
                }
              } else {
                console.error("Editor element x-ref not found in DOM after nextTick.");
              }
            });
          }
        });
      },

      triggerImageUpload() {
        this.$refs.imageUpload.click();
      },

      triggerCamera() {
        this.$refs.cameraUpload.click();
      },

      async uploader(files: FileList, schema: any) {
        const imageNodes = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // ensure it's an image
          if (!file || !file.type.startsWith("image")) {
            continue;
          }

          const placeholder = URL.createObjectURL(file);
          this.fileMap.set(placeholder, file);

          // Create the image node for the editor.
          const node = schema.nodes.image.create({
            src: placeholder,
          });
          imageNodes.push(node);
        }

        // Return the array of nodes to be inserted into the editor.
        return imageNodes;
      },

      async checkAuthStatus() {
        console.info("Checking authentication status...");
        this.errorMessage = "";
        try {
          // Force the client to throw an error on 401, making the catch block reliable
          const status = await Authentication.getAuthenticationStatus({ throwOnError: true });
          console.info("Auth status response received:", status);
          if (status.data?.isAuthenticated) {
            console.info("User is authenticated. Setting step to 'editor'.");
            this.isAuthenticated = true;
            this.step = "editor"; // Go to editor
          } else {
            console.info("User is not authenticated. Setting step to 'login'.");
            this.isAuthenticated = false;
            this.step = "login"; // Stay on login
          }
        } catch (error: any) {
          this.isAuthenticated = false;
          this.step = "login";
          if (isProblemDetails(error?.data)) {
            this.errorMessage = error.data.detail || error.data.title || "Authentication check failed.";
          } else {
            this.errorMessage = "An unknown error occurred during authentication check.";
          }
          console.error("Failed to get authentication status:", error);
        }
      },

      async handleLogin() {
        this.submitting = true;
        this.errorMessage = "";
        try {
          const response = await Authentication.postAuthenticationLogin({
            body: {
              emailAddress: this.login.emailAddress,
              password: this.login.password,
            },
            throwOnError: true,
          });

          // The login endpoint can return different objects on a 200 OK response.
          // We need to check for the 2FA case.
          const responseData = response.data as any;
          if (responseData && responseData.requiresTwoFactor) {
            this.errorMessage = "Two-factor authentication is not supported in this editor.";
            this.isAuthenticated = false;
          } else {
            // Otherwise, we assume a successful login.
            this.isAuthenticated = true;
            this.step = "editor";
          }
        } catch (error: any) {
          if (isProblemDetails(error?.data)) {
            this.errorMessage = error.data.detail || error.data.title || "Login failed.";
          } else {
            this.errorMessage = "An unknown error occurred during login.";
          }
          this.isAuthenticated = false;
          console.error("Login failed:", error);
        } finally {
          this.submitting = false;
        }
      },

      async handlePublish() {
        this.submitting = true;
        this.errorMessage = "";

        let processedMarkdown = this.post.markdown;
        const filesToUpload = new Map<string, File>();
        let i = 0;

        // Replace blob URLs with placeholders and collect files for upload
        for (const [blobUrl, file] of this.fileMap.entries()) {
          const placeholder = `placeholder-image-${i}`;
          processedMarkdown = processedMarkdown.replaceAll(blobUrl, placeholder);
          filesToUpload.set(placeholder, file);
          // Revoke the blob URL to free up memory
          URL.revokeObjectURL(blobUrl);
          i++;
        }

        const jsonData = JSON.stringify({
          title: this.post.title,
          markdown: processedMarkdown,
          author: this.post.author,
          tags: this.post.tags,
          categories: this.post.categories,
          published: this.post.published,
          excerpt: this.post.excerpt,
          slug: this.post.slug,
          files: Array.from(filesToUpload.keys()),
        });

        try {
          const response = await MarkdownEditor.postArticulateEditorsMarkdownPost({
            body: {
              json: jsonData,
              files: Array.from(filesToUpload.values()),
            },
          });

          // Cast the response data to the expected type
          const responseData = response.data as { url: string };
          this.successUrl = responseData.url ?? "#";
          this.step = "success"; // Go to success view
        } catch (error: any) {
          if (isProblemDetails(error?.data)) {
            this.errorMessage = error.data.detail || error.data.title || "Failed to publish post.";
          } else {
            this.errorMessage = "An unknown error occurred while publishing.";
          }
          console.error("Failed to publish post:", error);
        } finally {
          this.submitting = false;
        }
      },
    }));
  });

  Alpine.start();
  console.log("main.ts loaded and Alpine started.");
}
