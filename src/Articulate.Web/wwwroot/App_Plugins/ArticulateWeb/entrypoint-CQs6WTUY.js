import { UMB_AUTH_CONTEXT as s } from "@umbraco-cms/backoffice/auth";
import { c as i } from "./client.gen-DFzeT1VX.js";
const l = (n, e) => {
  console.log("Hello from my extension 🎉"), n.consumeContext(s, async (t) => {
    const o = t.getOpenApiConfiguration();
    i.setConfig({
      auth: o.token,
      baseUrl: o.base,
      credentials: o.credentials
    });
  });
}, a = (n, e) => {
  console.log("Goodbye from my extension 👋");
};
export {
  l as onInit,
  a as onUnload
};
//# sourceMappingURL=entrypoint-CQs6WTUY.js.map
