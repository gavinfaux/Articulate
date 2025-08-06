import { UMB_AUTH_CONTEXT as i } from "@umbraco-cms/backoffice/auth";
import { c as s } from "./client.gen-D3fYl9Hx.js";
const c = (o, e) => {
  o.consumeContext(i, (t) => {
    const n = t?.getOpenApiConfiguration();
    n && s.setConfig({
      auth: n?.token ?? void 0,
      baseUrl: n?.base ?? "",
      credentials: n?.credentials ?? "same-origin"
    });
  });
}, g = (o, e) => {
};
export {
  c as onInit,
  g as onUnload
};
//# sourceMappingURL=entrypoint-D6YpuHXE.js.map
