import type { UmbEntryPointOnInit } from '@umbraco-cms/backoffice/extension-api';
import { UMB_APP_CONTEXT } from '@umbraco-cms/backoffice/app';
import { manifest } from '../dashboards/manifests';

export const onInit: UmbEntryPointOnInit = (_host, extensionRegistry) => {
  extensionRegistry.register(manifest);
  _host.getContext(UMB_APP_CONTEXT).then(appContext => {
    appContext.getBackofficePath();
  })
};

