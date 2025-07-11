using Articulate.Routing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Articulate.Components
{
    internal class ConfigureArticulateMvcOptions(ArticulateFrontEndFilterConvention articulateFrontEndFilterConvention)
        : IConfigureOptions<MvcOptions>
    {
        public void Configure(MvcOptions options) => options.Conventions.Add(articulateFrontEndFilterConvention);
    }
}
