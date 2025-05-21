import { LitElement, html, customElement, state, css } from '@umbraco-cms/backoffice/external/lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import type { UmbNotificationContext } from '@umbraco-cms/backoffice/notification';
import { UMB_NOTIFICATION_CONTEXT } from '@umbraco-cms/backoffice/notification';


@customElement('articulate-dashboard')
export class ArticulateDashboardElement extends UmbElementMixin(LitElement) {
    static override styles = [
        css`

:host {
    display: block;
    background: var(--uui-color-surface);
    min-height: 100vh;
}

uui-card-block-type::part(name) {
    font-size: 1.25rem;
    font-weight: 900;
    color: var(--uui-color-text, #222);
    text-align: center;
    line-height: 1.2;
    letter-spacing: 0.01em;
    margin: 16px 0 0 0;
    display: block;
}

umb-body-layout {
    --umb-body-layout-padding: 0;
    margin-top: var(--uui-size-layout-1);
}
.header {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border-bottom: 1px solid var(--uui-color-border);
    box-sizing: border-box;
    background: var(--uui-color-surface);
}

.header-left {
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    height: 100%;
    box-sizing: border-box;
}
.header-right {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 96px;
    height: 68px;
    padding: 0 24px 0 0;
    box-sizing: border-box;
    float: right;
}

.header uui-heading {
    margin: 0;
    padding-left: 24px;
    font-size: 2.0rem;
    font-weight: 800;
    color: var(--uui-color-text);
    line-height: 1;
    display: flex;
    align-items: center;
    text-align: left;
    box-sizing: border-box;
}
.articulate-logo {
    width: 64px;
    height: 64px;
    display: block;
    margin: 0 auto;
    object-fit: contain;
    filter: drop-shadow(0 2px 8px rgba(185,74,72,0.18)); /* subtle 'bold' effect */
    padding: 0;
    vertical-align: middle;
    background: var(--uui-color-surface); /* matches header background */
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(185,74,72,0.08);
}
.articulate-logo:hover {
    opacity: 1;
}

.articulate-logo:hover {
    transform: scale(1.05);
}

.content {
    padding: 0;
    margin-top: 32px;
    margin-left: 20px;
    margin-right: 0;
    max-width: 1000px;
}
uui-box {
    background: none;
    border-radius: 0;
    box-shadow: none;
    margin: 0 auto;
    padding: 0;
    width: 100%;
}
.cards-container {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: stretch;
    gap: 32px;
    width: 100%;
}
uui-card-block-type {
    flex: 1 1 0;
    min-width: 240px;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: none;
    border: none;
    background: var(--uui-color-surface);
    padding: 32px 0 24px 0;
    margin: 0;
}
.card-title {
    font-size: 1.25rem;
    font-weight: 900;
    color: var(--uui-color-text);
    margin: 16px 0 0 0;
    text-align: center;
    line-height: 1.2;
    letter-spacing: 0.01em;
}
uui-icon {
    font-size: 24px;
    color: var(--uui-color-interactive);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: none;
    border-radius: 50%;
    margin: 0 auto;
}
uui-icon:hover {
    background: none;
    color: var(--uui-color-interactive-emphasis);
    transition: color 0.2s ease;
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
                        <!-- TODO: transparent background logo or remove header-right background styling -->
                        <img
                            src="https://raw.githubusercontent.com/Shandem/Articulate/master/assets/Icon.png"
                            alt="Articulate Logo"
                            class="articulate-logo">
                    </div>
                </div>
                
                <div class="content">
                    <uui-box>
                    <uui-icon-registry-essential>
                            <div class="cards-container">
                                <uui-card-block-type
                                    name="Articulate BlogML Importer"
                                    selectable>
                                    <uui-icon name="sync" aria-hidden="true"></uui-icon>
                                    
                                </uui-card-block-type>
                                <uui-card-block-type
                                    name="Articulate BlogML Exporter"
                                    selectable>
                                    <uui-icon name="download" aria-hidden="true"></uui-icon>
                                    
                                </uui-card-block-type>
                                <uui-card-block-type
                                    name="Articulate Theme"
                                    selectable>
                                    <uui-icon name="picture" aria-hidden="true"></uui-icon>
                                    
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
