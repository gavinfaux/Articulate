import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
export default class BlogImporterElement extends UmbLitElement {
    static styles = css`
        :host {
            display: block;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }
        
        .form-description {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
        }
        
        .form-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #1976d2;
            box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }
        
        .form-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }
        
        .toggle-switch {
            position: relative;
            width: 50px;
            height: 24px;
            background: #ccc;
            border-radius: 12px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .toggle-switch.active {
            background: #1976d2;
        }
        
        .toggle-switch::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: left 0.3s;
        }
        
        .toggle-switch.active::after {
            left: 28px;
        }
        
        .submit-button {
            background: #1976d2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .submit-button:hover {
            background: #1565c0;
        }
        
        .submit-button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .status-message {
            padding: 12px;
            border-radius: 4px;
            margin-top: 15px;
        }
        
        .status-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .status-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .help-text {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        
        .documentation-link {
            color: #1976d2;
            text-decoration: none;
        }
        
        .documentation-link:hover {
            text-decoration: underline;
        }
    `;

    static properties = {
        articulateNodeId: { type: String },
        blogMlFile: { type: Object },
        overwrite: { type: Boolean },
        publish: { type: Boolean },
        regexMatch: { type: String },
        regexReplace: { type: String },
        exportDisqusXml: { type: Boolean },
        importFirstImage: { type: Boolean },
        status: { type: String },
        isSubmitting: { type: Boolean },
        downloadLink: { type: String }
    };

    constructor() {
        super();
        this.articulateNodeId = '';
        this.blogMlFile = null;
        this.overwrite = false;
        this.publish = false;
        this.regexMatch = '';
        this.regexReplace = '';
        this.exportDisqusXml = false;
        this.importFirstImage = false;
        this.status = '';
        this.isSubmitting = false;
        this.downloadLink = '';
    }

    toggleOverwrite() {
        this.overwrite = !this.overwrite;
    }

    togglePublish() {
        this.publish = !this.publish;
    }

    toggleExportDisqus() {
        this.exportDisqusXml = !this.exportDisqusXml;
        if (this.exportDisqusXml) {
            this.publish = true; // Force publish when exporting to Disqus
        }
    }

    toggleImportFirstImage() {
        this.importFirstImage = !this.importFirstImage;
        if (this.importFirstImage) {
            this.publish = true; // Force publish when importing images
        }
    }

    handleFileChange(e) {
        this.blogMlFile = e.target.files[0];
    }

    async submitImport() {
        if (!this.articulateNodeId || !this.blogMlFile) {
            this.status = 'Please select both an Articulate blog node and a BlogML file.';
            return;
        }

        this.isSubmitting = true;
        this.status = 'Starting import...';

        try {
            const formData = new FormData();
            formData.append('articulateNodeId', this.articulateNodeId);
            formData.append('blogMlFile', this.blogMlFile);
            formData.append('overwrite', this.overwrite);
            formData.append('publish', this.publish);
            formData.append('regexMatch', this.regexMatch);
            formData.append('regexReplace', this.regexReplace);
            formData.append('exportDisqusXml', this.exportDisqusXml);
            formData.append('importFirstImage', this.importFirstImage);

            // Get the base URL from server variables or fallback
            const baseUrl = window.Umbraco?.Sys?.ServerVariables?.articulate?.articulateBlogImportBaseUrl || '/umbraco/backoffice/api/ArticulateBlogImport/';

            const response = await fetch(`${baseUrl}PostImportBlogMl`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.status = 'Finished!';
                if (this.exportDisqusXml && result.downloadLink) {
                    this.downloadLink = result.downloadLink;
                }
            } else {
                this.status = 'Import failed. Please check the console for details.';
            }
        } catch (error) {
            console.error('Import error:', error);
            this.status = 'Import failed due to an error.';
        } finally {
            this.isSubmitting = false;
        }
    }

    getStatusClass() {
        if (this.status === 'Finished!') return 'status-success';
        if (this.status.includes('failed') || this.status.includes('error')) return 'status-error';
        return 'status-info';
    }

    render() {
        return html`
            <div>
                <div class="form-group">
                    <div class="form-description">
                        See documentation for importing BlogMl content: 
                        <a href="https://github.com/Shazwazza/Articulate/wiki/Importing" target="_blank" class="documentation-link">
                            https://github.com/Shazwazza/Articulate/wiki/Importing
                        </a>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Articulate blog node</label>
                    <div class="form-description">Choose the Articulate blog node to import to</div>
                    <input 
                        type="text" 
                        class="form-input" 
                        .value=${this.articulateNodeId}
                        @input=${(e) => this.articulateNodeId = e.target.value}
                        placeholder="Enter node ID or use content picker"
                    />
                    <div class="help-text">Note: In a full implementation, this would be a content picker component</div>
                </div>

                <div class="form-group">
                    <label class="form-label">BlogMl import file</label>
                    <div class="form-description">Select BlogMl xml file to import</div>
                    <input 
                        type="file" 
                        class="form-input" 
                        accept=".xml,text/xml"
                        @change=${this.handleFileChange}
                    />
                </div>

                <div class="form-group">
                    <label class="form-label">Overwrite imported posts?</label>
                    <div class="form-description">Check if you want to overwrite posts already imported</div>
                    <div class="form-toggle">
                        <div 
                            class="toggle-switch ${this.overwrite ? 'active' : ''}"
                            @click=${this.toggleOverwrite}
                        ></div>
                        <span>Overwrite existing posts</span>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Publish all posts?</label>
                    <div class="form-description">Check if you want all imported posts to be published</div>
                    <div class="form-toggle">
                        <div 
                            class="toggle-switch ${this.publish ? 'active' : ''}"
                            @click=${this.togglePublish}
                        ></div>
                        <span>Publish all posts</span>
                    </div>
                    ${this.importFirstImage || this.exportDisqusXml ? html`
                        <div class="help-text">
                            Publishing is required when you want to export comments to Disqus or Import First Image.
                        </div>
                    ` : ''}
                </div>

                <div class="form-group">
                    <label class="form-label">Regex match expression</label>
                    <div class="form-description">Regex statement used to match content in the blog post to be replaced</div>
                    <input 
                        type="text" 
                        class="form-input" 
                        .value=${this.regexMatch}
                        @input=${(e) => this.regexMatch = e.target.value}
                    />
                </div>

                <div class="form-group">
                    <label class="form-label">Regex replacement statement</label>
                    <div class="form-description">Replacement statement used with the above match statement</div>
                    <input 
                        type="text" 
                        class="form-input" 
                        .value=${this.regexReplace}
                        @input=${(e) => this.regexReplace = e.target.value}
                    />
                </div>

                <div class="form-group">
                    <label class="form-label">Export Disqus Xml</label>
                    <div class="form-description">If you would like Articulate to output an XML file for importing comments to Disqus</div>
                    <div class="form-toggle">
                        <div 
                            class="toggle-switch ${this.exportDisqusXml ? 'active' : ''}"
                            @click=${this.toggleExportDisqus}
                        ></div>
                        <span>Export Disqus XML</span>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Import First Image from Post Attachments</label>
                    <div class="form-description">Try to import the first image URL from post attachments</div>
                    <div class="form-toggle">
                        <div 
                            class="toggle-switch ${this.importFirstImage ? 'active' : ''}"
                            @click=${this.toggleImportFirstImage}
                        ></div>
                        <span>Import first image</span>
                    </div>
                </div>

                <div class="form-group">
                    <button 
                        class="submit-button" 
                        @click=${this.submitImport}
                        ?disabled=${this.isSubmitting}
                    >
                        ${this.isSubmitting ? 'Importing...' : 'Submit'}
                    </button>
                </div>

                ${this.status ? html`
                    <div class="status-message ${this.getStatusClass()}">
                        ${this.status}
                        ${this.status === 'Finished!' && this.exportDisqusXml && this.downloadLink ? html`
                            <br><br>
                            Click <a href="${this.downloadLink}" target="_blank">here</a> to download the exported Disqus XML file
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('articulate-blog-importer', BlogImporterElement);
