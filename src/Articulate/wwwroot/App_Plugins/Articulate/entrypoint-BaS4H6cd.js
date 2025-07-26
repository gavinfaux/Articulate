import { UMB_AUTH_CONTEXT as c } from "@umbraco-cms/backoffice/auth";
import { c as i } from "./client.gen-BDEIDh_1.js";
const m = (r, t) => {
  r.consumeContext(c, (e) => {
    const s = e == null ? void 0 : e.getOpenApiConfiguration();
    s && i.setConfig({
      auth: (s == null ? void 0 : s.token) ?? void 0,
      baseUrl: (s == null ? void 0 : s.base) ?? "",
      credentials: (s == null ? void 0 : s.credentials) ?? "same-origin"
    });
  });
}, a = (r, t) => {
};
export {
  m as onInit,
  a as onUnload
};
