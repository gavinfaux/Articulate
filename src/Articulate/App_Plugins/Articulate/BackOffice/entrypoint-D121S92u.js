import { UMB_AUTH_CONTEXT as i } from "@umbraco-cms/backoffice/auth";
import { c as r } from "./client.gen-7oad9SSy.js";
const a = (n, o) => {
  n.consumeContext(i, (s) => {
    const e = s == null ? void 0 : s.getOpenApiConfiguration();
    r.setConfig({
      auth: (e == null ? void 0 : e.token) ?? void 0,
      baseUrl: (e == null ? void 0 : e.base) ?? "",
      credentials: (e == null ? void 0 : e.credentials) ?? "same-origin"
    });
  });
}, l = (n, o) => {
};
export {
  a as onInit,
  l as onUnload
};
//# sourceMappingURL=entrypoint-D121S92u.js.map
