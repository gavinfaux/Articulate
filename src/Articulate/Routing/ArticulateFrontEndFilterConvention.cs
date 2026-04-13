#nullable enable
using System.Reflection;
using Articulate.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace Articulate.Routing
{
    internal class ArticulateFrontEndFilterConvention : IApplicationModelConvention
    {
        /// <inheritdoc/>
        public void Apply(ApplicationModel application)
        {
            Assembly articulateAssembly = typeof(ArticulateController).Assembly;

            foreach (ControllerModel controller in application.Controllers
                         .Where(x => x.ControllerType.AsType().Assembly == articulateAssembly))
            {
                controller.Filters.Add(new ServiceFilterAttribute(typeof(RouteCacheRefresherFilter)));
            }
        }
    }
}
