using System;
using Microsoft.AspNetCore.Routing.Template;

namespace Articulate.Routing
{
    internal readonly struct ArticulateRouteTemplate(RouteTemplate routeTemplate) : IEquatable<ArticulateRouteTemplate>
    {
        private readonly string _template = routeTemplate.TemplateText;

        public RouteTemplate RouteTemplate { get; } = routeTemplate;

        public override bool Equals(object obj) => obj is ArticulateRouteTemplate template && Equals(template);
        public bool Equals(ArticulateRouteTemplate other) => _template == other._template;
        public override int GetHashCode() => HashCode.Combine(_template);
    }
}
