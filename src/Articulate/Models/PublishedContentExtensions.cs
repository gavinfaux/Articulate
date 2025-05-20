using System.Collections;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;

namespace Articulate.Models
{
    public static class PublishedContentExtensions
    {
        public static string GetArticulateCropUrl(this IPublishedContent content, string propertyAlias, VariationContext variationContext)
        {
            if (!content.ContentType.VariesByCulture())
            {
                return content.Value<MediaWithCrops>(propertyAlias)?.GetCropUrl(imageCropMode: ImageCropMode.Max) ?? string.Empty;
            }

            var property = content.GetProperty(propertyAlias);
            if (property == null)
            {
                return string.Empty;
            }

            var culture = property.PropertyType.VariesByCulture()
                ? variationContext?.Culture
                : string.Empty; // must be string empty, not null since that won't work :/ 

            return content.Value<MediaWithCrops>(propertyAlias, culture)?.GetCropUrl(imageCropMode: ImageCropMode.Max) ?? string.Empty;
        }

        public static IPublishedContent Next(this IPublishedContent content)
        {
            var found = false;
            foreach (var sibling in content.Parent.Children)
            {
                if (found)
                    return sibling;

                if (sibling.Id == content.Id)
                    found = true;
            }

            return null;
        }

        public static IPublishedContent Previous(this IPublishedContent content)
        {
            var found = false;
            IPublishedContent last = null;
            foreach (var sibling in content.Parent.Children)
            {
                if (found)
                    return last;

                if (sibling.Id == content.Id)
                {
                    found = true;
                }
                else
                {
                    last = sibling;
                }
            }

            //it could have been at the end
            if (found)
                return last;

            return null;
        }

        /// <summary>
        /// Returns true if there is more than x items
        /// </summary>
        /// <param name="source"></param>
        /// <param name="count"></param>
        /// <returns></returns>
        /// <summary>
        /// Returns true if source has at least <paramref name="count"/> elements efficiently.
        /// </summary>
        /// <remarks>Based on int Enumerable.Count() method.</remarks>
        public static bool HasMoreThan<TSource>(this IEnumerable<TSource> source, int count)
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));
            var collection = source as ICollection<TSource>;
            if (collection != null)
            {
                return collection.Count > count;
            }

            var collection2 = source as ICollection;
            if (collection2 != null)
            {
                return collection2.Count > count;
            }

            int num = 0;
            checked
            {
                using (var enumerator = source.GetEnumerator())
                {
                    while (enumerator.MoveNext())
                    {
                        num++;
                        if (num > count)
                        {
                            return true;
                        }
                    }
                }
            }

            return false; // < count
        }

    }
}
