#nullable enable
namespace Articulate.Services
{
    public interface IArticulateThemeRepository
    {
        public Task CopyThemeAsync(string themeName, string newThemeName);

        public Task<IEnumerable<string>> GetDefaultThemesAsync();

        public Task<IEnumerable<string>?> GetAllThemesAsync();
    }

}
