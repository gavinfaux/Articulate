import { LitElement, html, customElement, state, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import type { UmbNotificationContext } from '@umbraco-cms/backoffice/notification';
import { UMB_NOTIFICATION_CONTEXT } from '@umbraco-cms/backoffice/notification';


@customElement('articulate-dashboard')
export class ArticulateDashboardElement extends UmbElementMixin(LitElement) {
    static override styles = [
        css`
            umb-body-layout {
                --umb-body-layout-padding: 0;
                margin-top: var(--uui-size-layout-1);
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--uui-size-space-4) var(--uui-size-layout-2);
                width: 100%;
                max-width: 1000px;
                margin: 0 auto;
                border-bottom: 1px solid var(--uui-color-border);
            }

            .header-left {
                flex: 1;
                display: flex;
                align-items: center;
            }

            .header-right {
                display: flex;
                align-items: center;
                padding-left: var(--uui-size-space-4);
            }

            .header uui-heading {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 700;
                line-height: 1;
                color: var(--uui-color-text);
                height: 36px;
                display: flex;
                align-items: center;
            }

            .articulate-logo {
                height: 36px;
                width: auto;
                opacity: 0.85;
                transition: opacity 0.2s ease;
            }

            .articulate-logo:hover {
                opacity: 1;
            }

            .articulate-logo:hover {
                transform: scale(1.05);
            }

            .content {
                padding: 0 var(--uui-size-layout-2);
                margin: var(--uui-size-space-2) auto;
                max-width: 1000px;
            }

            uui-box {
                background: var(--uui-color-surface);
                border-radius: var(--uui-border-radius);
                box-shadow: var(--uui-shadow-depth-1);
                margin: 0;
                padding: var(--uui-size-space-4);
            }

            .cards-container {
                display: flex;
                flex-wrap: wrap;
                gap: var(--uui-size-space-4);
            }

            uui-card-block-type {
                flex: 1;
                min-width: 250px;
                --uui-card-block-type-background: var(--uui-color-surface);
                --uui-card-block-type-border: 1px solid var(--uui-color-border);
            }

            .card-title {
                font-size: var(--uui-type-h6);
                font-weight: 500;
                color: var(--uui-color-text);
                margin-top: var(--uui-size-space-3);
            }

            uui-icon {
                font-size: 32px;
                color: var(--uui-color-interactive);
                display: flex;
                align-items: center;
                justify-content: center;
                width: 48px;
                height: 48px;
                background: var(--uui-color-interactive-emphasis);
                border-radius: var(--uui-border-radius);
            }

            uui-icon:hover {
                background: var(--uui-color-interactive);
                color: var(--uui-color-interactive-emphasis);
                transition: all 0.2s ease;
            }
        `
    ];
    @state()
    private _loading = true;



    private _notificationContext?: UmbNotificationContext;

    constructor() {
        super();
        this.consumeContext(UMB_NOTIFICATION_CONTEXT, (instance) => {
            this._notificationContext = instance;
        });
    }

    async connectedCallback() {
        super.connectedCallback();
        await this._loadData();
    }

    private async _loadData() {
        this._loading = true;
        try {
            // TODO: Replace with actual data/api call 
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            

            
        } catch (error) {
            this._notificationContext?.peek('danger', {
                data: { 
                    headline: 'Error',
                    message: 'Failed to load Articulate data' 
                }
            });
        } finally {
            this._loading = false;
        }
    }


    override render() {
        if (this._loading) {
            return html`
                <uui-loader-bar></uui-loader-bar>
            `;
        }

        return html`
            <umb-body-layout>
                <div slot="header" class="header">
                    <div class="header-left">
                        <uui-heading>Articulate Management</uui-heading>
                    </div>
                    <div class="header-right">
                        <img
                            src="/App_Plugins/Articulate/assets/Icon-transparent.png"
                            alt="Articulate Logo"
                            class="articulate-logo">
                    </div>
                </div>
                
                <div class="content">
                    <uui-box>
                    <uui-icon-registry-essential>
                            <div class="cards-container">
                                <uui-card-block-type
                                    name="articulate-importer"
                                    selectable>
                                    <uui-icon name="arrow-down" slot="icon"></uui-icon>
                                    <span slot="title" class="card-title">Articulate BlogML Importer</span>
                                </uui-card-block-type>
                                <uui-card-block-type
                                    name="articulate-exporter"
                                    selectable>
                                    <uui-icon name="arrow-up" slot="icon"></uui-icon>
                                    <span slot="title" class="card-title">Articulate BlogML Exporter</span>
                                </uui-card-block-type>
                                <uui-card-block-type
                                    name="articulate-theme"
                                    selectable>
                                    <uui-icon name="brush" slot="icon"></uui-icon>
                                    <span slot="title" class="card-title">Articulate Theme</span>
                                </uui-card-block-type>
                            </div>
                        </uui-icon-registry-essential>
                    </uui-box>
                </div>
            </umb-body-layout>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'articulate-dashboard': ArticulateDashboardElement;
    }
}
