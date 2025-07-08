import { UMB_AUTH_CONTEXT as e } from "@umbraco-cms/backoffice/auth";
import { c as r } from "./client.gen-7oad9SSy.js";
const f = (n, s) => {
  n.consumeContext(e, (o) => {
    const i = o == null ? void 0 : o.getOpenApiConfiguration();
    i && r.setConfig(i);
  });
}, g = (n, s) => {
};
export {
  f as onInit,
  g as onUnload
};
