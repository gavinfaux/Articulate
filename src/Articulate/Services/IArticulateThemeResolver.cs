#nullable enable
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Articulate.Services
{

    public interface IArticulateThemeResolver
    {
        public string GetCurrentThemeName();

    }
}
