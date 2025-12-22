using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;

// TODO: #nullable enable
namespace Articulate
{
    internal static class ContentExtensions
    {
        internal static IContent CreateWithInvariantOrDefaultCultureName(
            this IContentService contentService,
            string name,
            IContent parent,
            IContentTypeComposition contentType,
            ILanguageService languageService,
            int userId = -1)
        {
            IContent content = contentService.Create(name, parent, contentType.Alias, userId);
            content.SetInvariantOrDefaultCultureName(name, contentType, languageService);
            return content;
        }

        internal static IContent CreateWithInvariantOrDefaultCultureName(
            this IContentService contentService,
            string name,
            int parent,
            IContentTypeComposition contentType,
            ILanguageService languageService,
            int userId = -1)
        {
            IContent content = contentService.Create(name, parent, contentType.Alias, userId);
            content.SetInvariantOrDefaultCultureName(name, contentType, languageService);
            return content;
        }

        internal static async void SetInvariantOrDefaultCultureName(
            this IContentBase content,
            string name,
            IContentTypeComposition contentType,
            ILanguageService languageService)
        {
            ArgumentNullException.ThrowIfNull(contentType, nameof(contentType));

            var variesByCulture = contentType.VariesByCulture();

            if (variesByCulture)
            {
                content.SetCultureName(name, await languageService.GetDefaultIsoCodeAsync());
            }
            else
            {
                content.Name = name;
            }
        }

        /// <summary>
        /// Sets the value for a property type with the correct variance
        /// </summary>
        /// <remarks>
        /// Used to safely set a value for a property taking into account if the property type varies by culture/segment.
        /// If varying by culture it will assign the value to the default language only.
        /// If varying by segment it will assign the value to no segment.
        /// </remarks>
        internal static async void SetInvariantOrDefaultCultureValue(
            this IContentBase content,
            string propertyTypeAlias,
            object value,
            IContentTypeComposition contentType,
            ILanguageService languageService)
        {
            ArgumentNullException.ThrowIfNull(contentType, nameof(contentType));

            var variesByCulture = VariesByCulture(propertyTypeAlias, contentType);

            content.SetValue(
                propertyTypeAlias,
                value,
                variesByCulture ? await languageService.GetDefaultIsoCodeAsync() : null);
        }

        /// <summary>
        /// Sets the tags for a property type with the correct variance
        /// </summary>
        /// <remarks>
        /// Used to safely set a value for a property taking into account if the property type varies by culture/segment.
        /// If varying by culture it will assign the value to the default language only.
        /// If varying by segment it will assign the value to no segment.
        /// </remarks>
        internal static async void AssignInvariantOrDefaultCultureTags(
            this IContentBase content,
            string propertyTypeAlias,
            IEnumerable<string> tags,
            IContentTypeComposition contentType,
            ILanguageService languageService,
            IDataTypeService dataTypeService,
            PropertyEditorCollection dataEditors,
            IJsonSerializer jsonSerializer,
            bool merge = false)
        {
            ArgumentNullException.ThrowIfNull(contentType, nameof(contentType));

            var variesByCulture = VariesByCulture(propertyTypeAlias, contentType);

            content.AssignTags(
                dataEditors,
                dataTypeService,
                jsonSerializer,
                propertyTypeAlias,
                tags,
                merge,
                variesByCulture ? await languageService.GetDefaultIsoCodeAsync() : null);
        }

        /// <summary>
        /// Sets all invariant or variant property values safely while taking into account the variance settings on the content type/property type
        /// </summary>
        /// <param name="content">The content to set the values for</param>
        /// <param name="propertyAlias">The property alias to set the values for</param>
        /// <param name="contentType"></param>
        /// <param name="propertyValueGetter">Callback to get the value to be set for the given culture</param>
        /// <remarks>
        /// This will only set property values for cultures that have been defined on the <see cref="IContentBase"/>, it will
        /// not set property values for cultures that don't yet exist on the content item.
        /// </remarks>
        internal static void SetAllPropertyCultureValues(
            this IContentBase content,
            string propertyAlias,
            IContentTypeComposition contentType,
            Func<IContentBase, IContentTypeComposition, ContentCultureInfos, object> propertyValueGetter)
        {
            ArgumentNullException.ThrowIfNull(contentType, nameof(contentType));

            if (content.ContentType.VariesByCulture() && content.CultureInfos is not null)
            {
                SetCultureVariantPropertyValues(content, propertyAlias, contentType, propertyValueGetter);
            }
            else
            {
                SetInvariantPropertyValue(content, propertyAlias, contentType, propertyValueGetter);
            }
        }

        private static void SetCultureVariantPropertyValues(
            IContentBase content,
            string propertyAlias,
            IContentTypeComposition contentType,
            Func<IContentBase, IContentTypeComposition, ContentCultureInfos, object> propertyValueGetter)
        {
            IPropertyType propertyType = contentType.CompositionPropertyTypes.FirstOrDefault(x => x.Alias == propertyAlias)
                ?? throw new InvalidOperationException($"No property type found by alias {propertyAlias}");
            foreach (ContentCultureInfos c in content.CultureInfos!)
            {

                var valueToSet = propertyValueGetter(content, contentType, c);
                if (IsNullOrEmptyValue(valueToSet))
                {
                    continue;
                }

                content.SetValue(propertyAlias, valueToSet, propertyType.VariesByCulture() ? c.Culture : null);
            }
        }

        private static void SetInvariantPropertyValue(
            IContentBase content,
            string propertyAlias,
            IContentTypeComposition contentType,
            Func<IContentBase, IContentTypeComposition, ContentCultureInfos, object> propertyValueGetter)
        {
            var propertyValue = propertyValueGetter(content, contentType, null);
            if (IsNullOrEmptyValue(propertyValue))
            {
                return;
            }

            content.SetValue(propertyAlias, propertyValue);
        }

        private static bool IsNullOrEmptyValue(object value)
        {
            return value is null || (value is string propValAsString && string.IsNullOrWhiteSpace(propValAsString));
        }

        private static bool VariesByCulture(string propertyTypeAlias, IContentTypeComposition contentType)
        {
            // will throw if the property type is not found
            var variesByCulture = contentType.VariesByCulture() && contentType.CompositionPropertyTypes.First(x => x.Alias.InvariantEquals(propertyTypeAlias)).VariesByCulture();

            return variesByCulture;
        }
    }
}
