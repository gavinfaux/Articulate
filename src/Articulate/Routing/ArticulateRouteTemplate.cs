// TODO: #nullable enable

using System.Numerics;
using Microsoft.AspNetCore.Routing.Template;

namespace Articulate.Routing
{
    internal readonly struct ArticulateRouteTemplate(RouteTemplate routeTemplate) : IEquatable<ArticulateRouteTemplate>,
        IEqualityOperators<ArticulateRouteTemplate, ArticulateRouteTemplate, bool>
    {
        private readonly string _template = routeTemplate.TemplateText ?? string.Empty;

        public RouteTemplate RouteTemplate { get; } = routeTemplate;

        public override bool Equals(object obj) => obj is ArticulateRouteTemplate template && Equals(template);

        public bool Equals(ArticulateRouteTemplate other) => _template == other._template;

        public override int GetHashCode() => _template?.GetHashCode() ?? 0;

        public static bool operator ==(ArticulateRouteTemplate left, ArticulateRouteTemplate right) => left.Equals(right);

        public static bool operator !=(ArticulateRouteTemplate left, ArticulateRouteTemplate right) => !(left == right);
    }
}

