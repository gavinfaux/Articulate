import { html, nothing, TemplateResult } from "@umbraco-cms/backoffice/external/lit";

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

export function renderErrorMessage(
  errors: { title: string; details: string[] } | null,
): TemplateResult | typeof nothing {
  if (!errors) {
    return nothing;
  }

  const { title, details } = errors;

  return html`
    <div
      style="padding: var(--uui-size-space-4); margin-block: 1rem; border: 1px solid var(--uui-color-danger-standalone); color: var(--uui-color-danger); border-radius: var(--uui-border-radius);"
    >
      <strong>${title}</strong>
      ${details.length > 0
        ? html`
            <ul style="margin: 0; padding-left: 20px; list-style-position: inside;">
              ${details.map(
                (e) => html`
                  <li>${e}</li>
                `,
              )}
            </ul>
          `
        : nothing}
    </div>
  `;
}
