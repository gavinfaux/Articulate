// TODO: #nullable enable
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;

namespace Articulate.Extensions
{
    public static class ContentExtensions
    {
        public static IContent CreateWithInvariantOrDefaultCultureName(
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

        public static IContent CreateWithInvariantOrDefaultCultureName(
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

        public static void SetInvariantOrDefaultCultureName(
            this IContentBase content,
            string name,
            IContentTypeComposition contentType,
            ILanguageService languageService)
        {
            if (contentType is null)
            {
                throw new ArgumentNullException(nameof(contentType));
            }

            var variesByCulure = contentType.VariesByCulture();

            if (variesByCulure)
            {
                content.SetCultureName(name, Task.Run(languageService.GetDefaultIsoCodeAsync).GetAwaiter().GetResult());
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
        public static void SetInvariantOrDefaultCultureValue(
            this IContentBase content,
            string propertyTypeAlias,
            object value,
            IContentTypeComposition contentType,
            ILanguageService languageService)
        {
            if (contentType is null)
            {
                throw new ArgumentNullException(nameof(contentType));
            }

            var variesByCulture = VariesByCulture(propertyTypeAlias, contentType);

            content.SetValue(
                propertyTypeAlias,
                value,
                variesByCulture ? Task.Run(languageService.GetDefaultIsoCodeAsync).GetAwaiter().GetResult() : null);
        }

        /// <summary>
        /// Sets the tags for a property type with the correct variance
        /// </summary>
        /// <remarks>
        /// Used to safely set a value for a property taking into account if the property type varies by culture/segment.
        /// If varying by culture it will assign the value to the default language only.
        /// If varying by segment it will assign the value to no segment.
        /// </remarks>
        public static void AssignInvariantOrDefaultCultureTags(
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
            if (contentType is null)
            {
                throw new ArgumentNullException(nameof(contentType));
            }

            var variesByCulture = VariesByCulture(propertyTypeAlias, contentType);

            content.AssignTags(
                dataEditors,
                dataTypeService,
                jsonSerializer,
                propertyTypeAlias,
                tags,
                merge,
                variesByCulture ? Task.Run(languageService.GetDefaultIsoCodeAsync).GetAwaiter().GetResult() : null);
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
        public static void SetAllPropertyCultureValues(
            this IContentBase content,
            string propertyAlias,
            IContentTypeComposition contentType,
            Func<IContentBase, IContentTypeComposition, ContentCultureInfos, object> propertyValueGetter)
        {
            if (contentType is null)
            {
                throw new ArgumentNullException(nameof(contentType));
            }

            if (content.ContentType.VariesByCulture() && content.CultureInfos is not null)
            {
                // iterate over any existing cultures defined on the content item
                foreach (ContentCultureInfos c in content.CultureInfos)
                {
                    IPropertyType propertyType = contentType.CompositionPropertyTypes.FirstOrDefault(x => x.Alias == propertyAlias) ?? throw new InvalidOperationException($"No property type found by alias {propertyAlias}");

                    var valueToSet = propertyValueGetter(content, contentType, c);
                    if (valueToSet is null || (valueToSet is string propValAsString && string.IsNullOrWhiteSpace(propValAsString)))
                    {
                        continue;
                    }

                    content.SetValue(propertyAlias, valueToSet, propertyType.VariesByCulture() ? c.Culture : null);
                }
            }
            else
            {
                var propertyValue = propertyValueGetter(content, contentType, null);
                if (propertyValue is null || (propertyValue is string propValAsString && string.IsNullOrWhiteSpace(propValAsString)))
                {
                    return;
                }

                content.SetValue(propertyAlias, propertyValue);
            }

        }

        private static bool VariesByCulture(string propertyTypeAlias, IContentTypeComposition contentType)
        {
            // will throw if the property type is not found
            var variesByCulture = contentType.VariesByCulture()
                // only look up the property type if the content type varies else there's no point
                ? contentType.CompositionPropertyTypes.First(x => x.Alias.InvariantEquals(propertyTypeAlias)).VariesByCulture()
                : false;

            return variesByCulture;
        }
    }
}
