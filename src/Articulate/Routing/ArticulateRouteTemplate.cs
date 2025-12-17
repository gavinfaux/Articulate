using System.Numerics;
using Microsoft.AspNetCore.Routing.Template;

// TODO: #nullable enable
namespace Articulate.Routing
{
    internal readonly struct ArticulateRouteTemplate(RouteTemplate routeTemplate) : IEquatable<ArticulateRouteTemplate>,
        IEqualityOperators<ArticulateRouteTemplate, ArticulateRouteTemplate, bool>
    {
        private readonly string _template = routeTemplate.TemplateText ?? string.Empty;

        public RouteTemplate RouteTemplate { get; } = routeTemplate;

        public static bool operator ==(ArticulateRouteTemplate left, ArticulateRouteTemplate right) => left.Equals(right);

        public static bool operator !=(ArticulateRouteTemplate left, ArticulateRouteTemplate right) => !(left == right);

        /// <inheritdoc/>
        public override bool Equals(object obj) => obj is ArticulateRouteTemplate template && Equals(template);

        /// <inheritdoc/>
        public bool Equals(ArticulateRouteTemplate other) => _template == other._template;

        /// <inheritdoc/>
        public override int GetHashCode() => HashCode.Combine(_template);
    }
}
