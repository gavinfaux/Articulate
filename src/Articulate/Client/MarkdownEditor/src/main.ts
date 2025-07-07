import { Authentication, MarkdownEditor } from "./api/sdk.gen";
import { Editor, defaultValueCtx, rootCtx, editorViewCtx, schemaCtx } from "@milkdown/kit/core";
import { history } from "@milkdown/kit/plugin/history";
import { listener, listenerCtx } from "@milkdown/kit/plugin/listener";
import { upload, uploadConfig } from "@milkdown/kit/plugin/upload";
import { isHeic } from "heic-to"
import { heicTo } from "heic-to/csp"
import { gfm } from "@milkdown/kit/preset/gfm";
import "@picocss/pico";
import Alpine from "alpinejs";

declare global {
  interface Window {
    Alpine: typeof Alpine;
    alpineInitialized?: boolean;
  }
}

window.Alpine = Alpine;

// Add a guard to prevent double initialization from HMR in dev environments
if (!window.alpineInitialized) {
  window.alpineInitialized = true;

  document.addEventListener("alpine:init", () => {
    Alpine.data("app", () => ({
      // --- State Management ---
      step: 1, // 1: login, 2: editor, 3: optional info, 4: success
      isAuthenticated: false,
      isLoading: true,
      submitting: false,
      errorMessage: "",
      successUrl: "#",
      caption: "Create a new post",
      fileMap: new Map<string, File>(),
      editor: null as Editor | null,

      // --- Models ---
      login: {
        username: "",
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
          if (newStep === 2 && !this.editor) {
            this.$nextTick(async () => {
              if (this.$refs.editor) {
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
                  .use(gfm)
                  .use(history)
                  .use(listener)
                  .use(upload)
                  .create();
                this.editor = editorInstance;
              }
            });
          }
        });
      },

      triggerImageUpload() {
        this.$refs.imageUpload.click();
      },

      triggerCameraUpload() {
        this.$refs.cameraUpload.click();
      },

      async uploader(files: FileList, schema: any) {
        const image = files[0];
        if (!image) return false;

        return this.processAndCreateImageNode(image, schema);
      },

      async processAndCreateImageNode(file: File, schema: any) {
        if (!file) return null;

        let processedFile = file;
        // The isHeic function from 'heic-to' expects the file object itself.
        if (await isHeic(file)) {
            try {
                // The heicTo function from 'heic-to/csp' expects an options object.
                const convertedBlob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.8 });
                processedFile = new File([convertedBlob], `${file.name.split(".")[0]}.jpeg`, {
                    type: "image/jpeg",
                    lastModified: new Date().getTime(),
                });
            } catch (error) {
                console.error("Error converting HEIC to JPEG:", error);
                return null;
            }
        }

        const placeholder = URL.createObjectURL(processedFile);
        this.fileMap.set(placeholder, processedFile);

        // Create and return the node for the upload plugin to insert.
        return schema.nodes.image.create({
            src: placeholder,
        });
      },

      async handleFileInput(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.editor!.action(async (ctx) => {
            const schema = ctx.get(schemaCtx);
            const node = await this.processAndCreateImageNode(file, schema);

            if (node) {
                const view = ctx.get(editorViewCtx);
                const { state } = view;
                // The node returned is an image, we need to wrap it in a paragraph to insert it correctly.
                const fragment = state.schema.nodes.paragraph.create(null, node);
                const tr = state.tr.insert(state.selection.from, fragment);
                view.dispatch(tr);
            }
        });

        // Clear the input value to allow the same file to be selected again
        input.value = "";
      },

      async checkAuthStatus() {
        console.info("Checking authentication status...");
        this.isLoading = true;
        this.errorMessage = "";
        try {
          // Force the client to throw an error on 401, making the catch block reliable
          const status = await Authentication.getAuthenticationStatus({ throwOnError: true });
          console.info("Auth status response received:", status);
          if (status.data?.isAuthenticated) {
            console.info("User is authenticated. Setting step to 2.");
            this.isAuthenticated = true;
            this.step = 2; // Go to editor
          } else {
            // This block should not be reached if an unauthenticated response throws.
            console.info("User is not authenticated, but no error was thrown. Setting step to 1.");
            this.isAuthenticated = false;
            this.step = 1; // Stay on login
          }
        } catch (error: any) {
          console.error("Failed to get authentication status:", error);
          console.info("Auth check failed due to an error. Setting step to 1.");
          this.isAuthenticated = false;
          this.step = 1;
        } finally {
          this.isLoading = false;
          console.info("Auth check complete. isLoading is now false.");
        }
      },

      async handleLogin() {
        this.submitting = true;
        this.errorMessage = "";
        try {
          const response = await Authentication.postAuthenticationLogin({
            body: {
              username: this.login.username,
              password: this.login.password,
            } as any, // Cast to any to bypass strict type check for now
          });

          const responseData = response.data;
          // Check for a successful login response
          if (responseData && typeof responseData === 'object' && 'isAuthenticated' in responseData && responseData.isAuthenticated) {
              this.isAuthenticated = true;
              this.step = 2; // Go to editor
          } 
          // Check for a 2FA required response
          else if (responseData && typeof responseData === 'object' && 'requiresTwoFactor' in responseData) {
               this.errorMessage = "Two-factor authentication is not supported in this editor.";
               this.isAuthenticated = false;
          }
          else {
              this.errorMessage = "Login failed. Please check your credentials.";
              this.isAuthenticated = false;
          }
        } catch (error: any) {
          this.errorMessage = `Login failed: ${error.message || 'Please check your credentials and try again.'}`;
          this.isAuthenticated = false;
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
          this.step = 4; // Go to success view
        } catch (error: any) {
          this.errorMessage = `Failed to publish post: ${error.message}`;
        } finally {
          this.submitting = false;
        }
      },
    }));
  });

  Alpine.start();
  console.log("main.ts loaded and Alpine started.");
}
