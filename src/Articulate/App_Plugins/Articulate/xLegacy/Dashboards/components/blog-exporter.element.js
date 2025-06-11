import { html, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
export default class BlogExporterElement extends UmbLitElement {
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
        
        .download-link {
            color: #1976d2;
            text-decoration: underline;
        }
        
        .download-link:hover {
            text-decoration: none;
        }
    `;

    static properties = {
        articulateNodeId: { type: String },
        embedImages: { type: Boolean },
        status: { type: String },
        isSubmitting: { type: Boolean },
        downloadLink: { type: String }
    };

    constructor() {
        super();
        this.articulateNodeId = '';
        this.embedImages = false;
        this.status = '';
        this.isSubmitting = false;
        this.downloadLink = '';
    }

    toggleEmbedImages() {
        this.embedImages = !this.embedImages;
    }

    async submitExport() {
        if (!this.articulateNodeId) {
            this.status = 'Please select an Articulate blog node to export from.';
            return;
        }

        this.isSubmitting = true;
        this.status = 'Starting export...';
        this.downloadLink = '';

        try {
            // Get the base URL from server variables or fallback
            const baseUrl = window.Umbraco?.Sys?.ServerVariables?.articulate?.articulateBlogExportBaseUrl || '/umbraco/backoffice/api/ArticulateBlogExport/';

            const response = await fetch(`${baseUrl}PostExportBlogMl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    articulateNodeId: this.articulateNodeId,
                    embedImages: this.embedImages
                })
            });

            if (response.ok) {
                // Check if response is a file download
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    // JSON response with download link
                    const result = await response.json();
                    this.status = 'Finished!';
                    if (result.downloadLink) {
                        this.downloadLink = result.downloadLink;
                    }
                } else {
                    // Direct file download
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    
                    // Get filename from response headers or use default
                    const contentDisposition = response.headers.get('content-disposition');
                    let filename = 'blog-export.xml';
                    if (contentDisposition) {
                        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                        if (matches != null && matches[1]) {
                            filename = matches[1].replace(/['"]/g, '');
                        }
                    }
                    
                    // Create download link
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    this.status = 'Finished!';
                }
            } else {
                this.status = 'Export failed. Please check the console for details.';
                console.error('Export failed:', response.statusText);
            }
        } catch (error) {
            console.error('Export error:', error);
            this.status = 'Export failed due to an error.';
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
                    <label class="form-label">Articulate blog node</label>
                    <div class="form-description">Choose the Articulate blog node to export from</div>
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
                    <label class="form-label">Embed images?</label>
                    <div class="form-description">
                        Check if you want to embed images as base64 data in the output file. 
                        Useful if your site isn't going to be HTTP accessible to the site you will be importing on.
                    </div>
                    <div class="form-toggle">
                        <div 
                            class="toggle-switch ${this.embedImages ? 'active' : ''}"
                            @click=${this.toggleEmbedImages}
                        ></div>
                        <span>Embed images as base64</span>
                    </div>
                </div>

                <div class="form-group">
                    <button 
                        class="submit-button" 
                        @click=${this.submitExport}
                        ?disabled=${this.isSubmitting}
                    >
                        ${this.isSubmitting ? 'Exporting...' : 'Submit'}
                    </button>
                </div>

                ${this.status ? html`
                    <div class="status-message ${this.getStatusClass()}">
                        ${this.status}
                        ${this.status === 'Finished!' && this.downloadLink ? html`
                            <br><br>
                            Click <a href="${this.downloadLink}" target="_blank" class="download-link">here</a> to download the exported BlogML file
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('articulate-blog-exporter', BlogExporterElement);
