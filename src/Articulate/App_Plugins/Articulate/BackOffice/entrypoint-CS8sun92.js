import { UMB_AUTH_CONTEXT as n } from "@umbraco-cms/backoffice/auth";
import { c as o } from "./client.gen-7oad9SSy.js";
const a = (r, t) => {
  r.consumeContext(n, (e) => {
    const s = e == null ? void 0 : e.getOpenApiConfiguration(), c = {
      auth: (s == null ? void 0 : s.token) ?? void 0,
      baseUrl: (s == null ? void 0 : s.base) ?? "",
      credentials: (s == null ? void 0 : s.credentials) ?? "same-origin"
    };
    o.setConfig(c);
  });
}, l = (r, t) => {
};
export {
  a as onInit,
  l as onUnload
};
