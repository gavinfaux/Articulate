#nullable enable
using Articulate.Routing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Articulate.Options
{
    internal class ConfigureArticulateMvcOptions(ArticulateFrontEndFilterConvention articulateFrontEndFilterConvention)
        : IConfigureOptions<MvcOptions>
    {
        /// <inheritdoc/>
        public void Configure(MvcOptions options) => options.Conventions.Add(articulateFrontEndFilterConvention);
    }
}
