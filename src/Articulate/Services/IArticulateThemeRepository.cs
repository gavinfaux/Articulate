#nullable enable
namespace Articulate.Services
{
    public interface IArticulateThemeRepository
    {
        public Task<IEnumerable<string>> GetDefaultThemesAsync();

        public Task<IEnumerable<string>?> GetAllThemesAsync();

        internal Task CopyThemeAsync(string themeName, string newThemeName);
    }
}
