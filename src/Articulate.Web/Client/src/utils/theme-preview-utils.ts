/**
 * Returns the backoffice preview image URL for a theme name.
 * @param {string | undefined | null} theme The theme name.
 * @returns {string} The preview image URL, or an empty string when no theme is set.
 */
export function getThemePreviewUrl(theme: string | undefined | null): string {
  const normalizedTheme = theme?.trim();
  if (!normalizedTheme) {
    return '';
  }

  return `/App_Plugins/Articulate/BackOffice/assets/theme-${normalizedTheme.toLowerCase()}.png`;
}

/**
 * Hides a preview image and injects a single-letter fallback when the asset is missing.
 * @param {Event} event The image error event.
 * @param {string} theme The theme name used for the fallback initial.
 */
export function handleThemePreviewError(event: Event, theme: string): void {
  const img = event.target as HTMLImageElement | null;
  if (!img) {
    return;
  }

  img.style.display = 'none';

  const parent = img.parentElement;
  if (!parent) {
    return;
  }

  if (!parent.querySelector(':scope > .theme-fallback-initial')) {
    const span = document.createElement('span');
    span.className = 'theme-fallback-initial';
    span.textContent = theme.charAt(0).toUpperCase();
    parent.appendChild(span);
  }
}
