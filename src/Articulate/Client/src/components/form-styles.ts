import { css } from "@umbraco-cms/backoffice/external/lit";

export const formStyles = css`
  uui-box {
    margin-top: var(--uui-size-space-6);
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

  .form-actions {
    margin-top: var(--uui-size-space-6);
    text-align: right;
  }
`;
