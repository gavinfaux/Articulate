import { css, html, nothing, TemplateResult } from "@umbraco-cms/backoffice/external/lit";

/**
 * Renders a header action button that navigates back to the Articulate dashboard.
 * @param {string} [routerPath] Optional router path for the back button. Defaults to the main Articulate dashboard.
 * @returns {TemplateResult} The Lit `TemplateResult` for the header actions slot.
 */
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

/**
 * Renders an error message box if errors are present.
 * @param {{ title: string; details: string[] } | null} errors An object containing the error title and details, or null if there are no errors.
 * @returns {TemplateResult | typeof nothing} The Lit `TemplateResult` for the error message, or `nothing` if no errors are provided.
 */
export function renderErrorMessage(
  errors: { title: string; details: string[] } | null,
): TemplateResult | typeof nothing {
  if (!errors) {
    console.info("At validation event: renderErrorMessage returning nothing as errors object is null");
    return nothing;
  }

  const { title, details } = errors;

  return html`
    <div class="articulate-error-box">
      <strong>${title}</strong>
      ${details.length > 0
        ? html`
            <ul class="articulate-error-list">
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

export const BoxStyles = css`
  uui-box {
    margin-top: var(--uui-size-space-6);
    max-width: var(--uui-size-content);
    margin-inline: auto;
  }
`;

export const FormStyles = css`
  .container {
    max-width: var(--uui-size-content);
    margin-inline: auto;
  }
  uui-form-layout-item {
    margin-bottom: var(--uui-size-space-4);
  }
  uui-label {
    min-width: var(--uui-size-input-medium);
    font-weight: var(--uui-weight-medium);
  }
  uui-input {
    width: auto;
  }
  .form-actions {
    margin-top: var(--uui-size-space-6);
    text-align: right;
  }
`;

export const NodePickerStyles = css`
  .node-picker-container {
    display: flex;
    align-items: center;
    gap: var(--uui-size-space-3);
  }
`;

export const ErrorBoxStyles = css`
  .articulate-error-box {
    padding: var(--uui-size-space-4);
    margin-block: 1rem;
    border: 1px solid var(--uui-color-danger-standalone);
    color: var(--uui-color-danger);
    border-radius: var(--uui-border-radius);
  }

  .articulate-error-list {
    margin: 0;
    padding-left: 20px;
    list-style-position: inside;
  }
`;

export const HostStyles = css`
  :host {
    display: block;
    padding: var(--uui-size-space-5);
  }
  @media (max-width: 768px) {
    :host {
      padding: var(--uui-size-space-3);
    }
  }
`;
