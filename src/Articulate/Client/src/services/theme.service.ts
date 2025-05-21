import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';

// TODO: Replace with auto-generated service when API is ready
export class ThemeService {
  // Store the host for future use with the real API
  #host: UmbControllerHost;

  constructor(host: UmbControllerHost) {
    this.#host = host;
    // Using the host to prevent unused variable warning
    void this.#host;
  }

  async duplicateTheme(sourceName: string, newName: string): Promise<{ name: string; path: string }> {
    // Mock implementation - replace with actual API call when available
    console.log(`[ThemeService] Duplicating theme ${sourceName} to ${newName} (mock implementation)`);
    return { name: newName, path: `/App_Plugins/Articulate/Themes/${newName}` };
  }

  async getThemes(): Promise<Array<{ name: string; path: string }>> {
    // Mock implementation - replace with actual API call when available
    console.log('[ThemeService] Getting themes (mock implementation)');
    return [
      { name: 'Standard', path: '/App_Plugins/Articulate/Themes/Standard' },
      { name: 'Clean', path: '/App_Plugins/Articulate/Themes/Clean' },
    ];
  }

  async createTheme(name: string, templatePath: string): Promise<{ name: string; path: string }> {
    // Mock implementation - replace with actual API call when available
    console.log(`[ThemeService] Creating theme ${name} from ${templatePath} (mock implementation)`);
    return { name, path: `/App_Plugins/Articulate/Themes/${name}` };
  }

  async deleteTheme(themePath: string): Promise<void> {
    // Mock implementation - replace with actual API call when available
    console.log(`[ThemeService] Deleting theme at ${themePath} (mock implementation)`);
    return Promise.resolve();
  }

  async getThemeTemplates(): Promise<Array<{ name: string; path: string }>> {
    // Mock implementation - replace with actual API call when available
    console.log('[ThemeService] Getting theme templates (mock implementation)');
    return [
      { name: 'Blank', path: '/App_Plugins/Articulate/Themes/Blank' },
      { name: 'Standard', path: '/App_Plugins/Articulate/Themes/Standard' },
    ];
  }
}
