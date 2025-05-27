import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";

// TODO: Replace with auto-generated service when API is ready
export class ThemeService {
  #host: UmbControllerHost;

  constructor(host: UmbControllerHost) {
    this.#host = host;
    void this.#host;
  }

  async duplicateTheme(
    sourceName: string,
    newName: string,
  ): Promise<{ name: string; path: string }> {
    console.log(
      `[ThemeService] Duplicating theme ${sourceName} to ${newName} (mock implementation)`,
    );
    return { name: newName, path: `/App_Plugins/Articulate/Themes/${newName}` };
  }

  async getThemes(): Promise<Array<{ name: string; path: string }>> {
    console.log("[ThemeService] Getting themes (mock implementation)");
    return [
      { name: "material", path: "/App_Plugins/Articulate/Themes/material" },
      { name: "mini", path: "/App_Plugins/Articulate/Themes/mini" },
      { name: "phantom", path: "/App_Plugins/Articulate/Themes/phantom" },
      { name: "vapor", path: "/App_Plugins/Articulate/Themes/vapor" },
      { name: "custom", path: "/Views/Articulate/Themes/custom" },
    ];
  }

  async createTheme(
    name: string,
    templatePath: string,
  ): Promise<{ name: string; path: string }> {
    console.log(
      `[ThemeService] Creating theme ${name} from ${templatePath} (mock implementation)`,
    );
    return { name, path: `/App_Plugins/Articulate/Themes/${name}` };
  }

  async deleteTheme(themePath: string): Promise<void> {
    console.log(
      `[ThemeService] Deleting theme at ${themePath} (mock implementation)`,
    );
    return Promise.resolve();
  }

  async getThemeTemplates(): Promise<Array<{ name: string; path: string }>> {
    console.log("[ThemeService] Getting theme templates (mock implementation)");
    return [
      { name: "material", path: "/App_Plugins/Articulate/Themes/material" },
      { name: "mini", path: "/App_Plugins/Articulate/Themes/mini" },
      { name: "phantom", path: "/App_Plugins/Articulate/Themes/phantom" },
      { name: "vapor", path: "/App_Plugins/Articulate/Themes/vapor" },
    ];
  }
}
