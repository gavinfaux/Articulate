import { html, TemplateResult } from "@umbraco-cms/backoffice/external/lit";

export function renderHeaderActions(routerPath?: string): TemplateResult {
  return html`
    <div slot="header-actions">
      <uui-button
        label="Back to Articulate dashboard options"
        look="outline"
        compact
        href=${routerPath || "/umbraco/section/settings/dashboard/articulate"}
      >
        ← Back
      </uui-button>
    </div>
  `;
}
