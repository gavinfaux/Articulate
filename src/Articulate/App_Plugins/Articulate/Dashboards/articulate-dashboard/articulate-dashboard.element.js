import { LitElement, html, css } from 'lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';

export default class ArticulateDashboardElement extends UmbElementMixin(LitElement) {
    static styles = css`
        :host {
            display: block;
            padding: 20px;
        }
        
        .dashboard-header {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .dashboard-header img {
            width: 60px;
            height: 60px;
            margin-right: 20px;
        }
        
        .dashboard-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            color: #333;
        }
        
        .welcome-box {
            background: #e8f5e8;
            border: 1px solid #d4edda;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .welcome-box img {
            float: right;
            width: 200px;
            margin-left: 20px;
        }
        
        .welcome-title {
            color: #155724;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .welcome-text {
            color: #155724;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        
        .welcome-text a {
            color: #0066cc;
            text-decoration: underline;
        }
        
        .management-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .management-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .management-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-color: #1976d2;
        }
        
        .card-icon {
            font-size: 2em;
            margin-bottom: 10px;
            color: #1976d2;
        }
        
        .card-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin: 0;
        }
        
        .card-description {
            font-size: 14px;
            color: #666;
            margin-top: 8px;
        }
        
        .back-link {
            display: inline-flex;
            align-items: center;
            color: #1976d2;
            text-decoration: none;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .back-link:hover {
            text-decoration: underline;
        }
        
        .detail-view {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
        }
        
        .detail-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
        }
        
        .component-container {
            width: 100%;
        }
    `;

    static properties = {
        viewState: { type: String },
        selectedGroup: { type: Object },
        justInstalled: { type: Boolean }
    };

    constructor() {
        super();
        this.viewState = 'list';
        this.selectedGroup = null;
        this.justInstalled = this.checkIfJustInstalled();
        
        this.groups = [
            {
                name: "Articulate BlogMl Importer",
                icon: "icon-download-alt",
                description: "Import blog content from BlogML format",
                component: "articulate-blog-importer"
            },
            {
                name: "Articulate BlogMl Exporter", 
                icon: "icon-out",
                description: "Export blog content to BlogML format",
                component: "articulate-blog-exporter"
            },
            {
                name: "Articulate Themes",
                icon: "icon-color-bucket", 
                description: "Manage and configure blog themes",
                component: "articulate-themes-manager"
            }
        ];
    }

    checkIfJustInstalled() {
        // Check URL parameters or local storage for installation status
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('packageId');
    }

    async openGroup(group) {
        this.viewState = 'details';
        this.selectedGroup = group;
        
        // Dynamically load the component if needed
        try {
            switch (group.component) {
                case 'articulate-blog-importer':
                    await import('../components/blog-importer.element.js');
                    break;
                case 'articulate-blog-exporter':
                    await import('../components/blog-exporter.element.js');
                    break;
                case 'articulate-themes-manager':
                    await import('../components/themes-manager.element.js');
                    break;
            }
        } catch (error) {
            console.error('Failed to load component:', error);
        }
    }

    setViewState(state) {
        this.viewState = state;
        if (state === 'list') {
            this.selectedGroup = null;
        }
    }

    renderWelcomeBox() {
        return html`
            <div class="welcome-box">
                <img src="https://raw.githubusercontent.com/Shandem/Articulate/master/assets/Icon.png" alt="Articulate" />
                <h3 class="welcome-title">Articulate installed</h3>
                
                <p class="welcome-text">
                    The installer has installed all of the required Umbraco nodes including some demo data.
                    You can either modify this demo data or simply remove it once you are comfortable with how Articulate works.
                    The demo data includes: a blog post, an author, a category and a tag.
                </p>
                
                <p class="welcome-text">
                    To customize your blog navigate to the Content section and click on the Articulate 'Blog' node. Here you can customize
                    the look and feel of your blog, including changing the <a href="https://github.com/Shandem/Articulate/wiki/Installed-Themes" target="_blank">theme</a>, 
                    adding Google analytics tracking, etc... If you want comments enabled you should sign up for a 
                    <a href="https://disqus.com/" target="_blank">Disqus account</a> and ensure you enter your Disqus details on the 'Blog' node.
                </p>
                
                <p class="welcome-text">
                    Click <a href="https://github.com/Shandem/Articulate/wiki" target="_blank">Here</a> to view Articulate documentation.
                </p>
            </div>
        `;
    }

    renderManagementGrid() {
        return html`
            <div class="management-grid">
                ${this.groups.map(group => html`
                    <div class="management-card" @click=${() => this.openGroup(group)}>
                        <div class="card-icon ${group.icon}"></div>
                        <h3 class="card-title">${group.name}</h3>
                        <p class="card-description">${group.description}</p>
                    </div>
                `)}
            </div>
        `;
    }

    renderDetailView() {
        if (!this.selectedGroup) return '';
        
        return html`
            <a href="#" class="back-link" @click=${(e) => { e.preventDefault(); this.setViewState('list'); }}>
                ← Back to overview
            </a>
            
            <div class="detail-view">
                <h2 class="detail-title">${this.selectedGroup.name}</h2>
                
                <div class="component-container">
                    ${this.renderComponentForGroup(this.selectedGroup)}
                </div>
            </div>
        `;
    }

    renderComponentForGroup(group) {
        switch (group.component) {
            case 'articulate-blog-importer':
                return html`<articulate-blog-importer></articulate-blog-importer>`;
            case 'articulate-blog-exporter':
                return html`<articulate-blog-exporter></articulate-blog-exporter>`;
            case 'articulate-themes-manager':
                return html`<articulate-themes-manager></articulate-themes-manager>`;
            default:
                return html`<p>Component not found: ${group.component}</p>`;
        }
    }

    render() {
        return html`
            ${this.viewState === 'list' ? html`
                <div class="dashboard-header">
                    <img src="https://raw.githubusercontent.com/Shandem/Articulate/master/assets/Icon.png" alt="Articulate" />
                    <h1 class="dashboard-title">Articulate Management</h1>
                </div>

                ${this.justInstalled ? this.renderWelcomeBox() : ''}
                
                ${!this.justInstalled ? this.renderManagementGrid() : ''}
                
            ` : this.renderDetailView()}
        `;
    }
}

customElements.define('articulate-dashboard', ArticulateDashboardElement);