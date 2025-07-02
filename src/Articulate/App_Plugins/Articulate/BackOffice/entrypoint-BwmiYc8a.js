import { UMB_AUTH_CONTEXT as i } from "@umbraco-cms/backoffice/auth";
import { c as a } from "./client.gen-7oad9SSy.js";
import { c as l } from "./client.gen--au1sZxC.js";
const _ = (t, r) => {
  const e = document.createElement("link");
  e.rel = "stylesheet", e.href = "/App_Plugins/Articulate/BackOffice/assets/css/backoffice.css", document.head.appendChild(e), t.consumeContext(i, (c) => {
    const s = c == null ? void 0 : c.getOpenApiConfiguration(), n = {
      auth: (s == null ? void 0 : s.token) ?? void 0,
      baseUrl: (s == null ? void 0 : s.base) ?? "",
      credentials: (s == null ? void 0 : s.credentials) ?? "same-origin"
    };
    [a, l].forEach((o) => o.setConfig(n));
  });
}, k = (t, r) => {
};
export {
  _ as onInit,
  k as onUnload
};
