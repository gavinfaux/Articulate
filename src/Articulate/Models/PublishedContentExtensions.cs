using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Extensions;

namespace Articulate.Models
{
    public static class PublishedContentExtensions
    {
        public static string GetArticulateCropUrl(this IPublishedContent content, string propertyAlias,
            VariationContext variationContext)
        {
            if (!content.ContentType.VariesByCulture())
            {
                return content.Value<MediaWithCrops>(propertyAlias)?.GetCropUrl(imageCropMode: ImageCropMode.Max) ??
                       string.Empty;
            }

            var property = content.GetProperty(propertyAlias);
            if (property == null)
            {
                return string.Empty;
            }

            var culture = property.PropertyType.VariesByCulture()
                ? variationContext?.Culture
                : string.Empty; // must be string empty, not null since that won't work :/ 

            return content.Value<MediaWithCrops>(propertyAlias, culture)
                ?.GetCropUrl(imageCropMode: ImageCropMode.Max) ?? string.Empty;
        }

        public static IPublishedContent Next(this IPublishedContent content)
        {
            var found = false;
            foreach (var sibling in content.Parent.Children)
            {
                if (found)
                {
                    return sibling;
                }

                if (sibling.Id == content.Id)
                {
                    found = true;
                }
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
                {
                    return last;
                }

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
            {
                return last;
            }

            return null;
        }

        /// <summary>
        ///     Returns true if there is more than x items
        /// </summary>
        /// <param name="source"></param>
        /// <param name="count"></param>
        /// <returns></returns>
        /// <summary>
        ///     Returns true if source has at least <paramref name="count" /> elements efficiently.
        /// </summary>
        /// <remarks>Based on int Enumerable.Count() method.</remarks>
        public static bool HasMoreThan<TSource>(this IEnumerable<TSource> source, int count)
        {
            if (source == null)
            {
                throw new ArgumentNullException(nameof(source));
            }

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

            var num = 0;
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

        public static string GetBaseImageUrl(this IPublishedContent content, string propertyAlias)
        {
            if (content == null)
            {
                return null;
            }

            var url = content.Value<MediaWithCrops>(propertyAlias)?.Url();

            if (string.IsNullOrWhiteSpace(url))
            {
                url = content.GetProperty(propertyAlias)?.GetSourceValue()?.ToString();
                if (url==null || url.IsNullOrWhiteSpace() || url.Equals("[]"))
                {
                    url = string.Empty;
                }
            }

            return url;
        }

        public static string GetCroppedImageUrl(this IPublishedContent content, string propertyAlias, string cropAlias, ImageCropMode imageCropMode = ImageCropMode.Max, string fallbackBgColor = "ffffff")
        {
            if (content == null || string.IsNullOrWhiteSpace(cropAlias) || string.IsNullOrWhiteSpace(propertyAlias))
            {
                return null;
            }

            var cropUrl = content.Value<MediaWithCrops>(propertyAlias)?.GetCropUrl(cropAlias);
            if (string.IsNullOrWhiteSpace(cropUrl))
            {
                var baseUrl = content.GetBaseImageUrl(propertyAlias);

                if (!string.IsNullOrWhiteSpace(baseUrl))
                {
                    var (width, height) = GetDimensionsForAlias(cropAlias);

                    if (width > 0 && height > 0)
                    {
                        cropUrl = baseUrl.GetCropUrl(width, height, imageCropMode: imageCropMode, furtherOptions: $"bgColor={fallbackBgColor}");
                    }
                }
            }

            return cropUrl;
        }

        /// <summary>
        /// A private helper to map crop aliases to dimensions.
        /// </summary>
        private static (int, int) GetDimensionsForAlias(string cropAlias)
        {
            var dataTypeService = StaticServiceProvider.Instance.GetRequiredService<IDataTypeService>();
            var picker = dataTypeService.GetDataType(ArticulateConstants.ArticulateImagePicker);
            var config = picker?.ConfigurationAs<MediaPicker3Configuration>();
            var crops = config?.Crops;
            var crop = crops?.FirstOrDefault(x => x.Alias == cropAlias);
            return crop == null ? (0, 0) : (crop.Width, crop.Height);
        }
		
		        /// <summary>
        ///     Shuffles a span of elements in-place using a provided Random instance.
        /// </summary>
        public static void Shuffle<T>(this Span<T> span, Random rng)
        {
            if (rng == null)
            {
                throw new ArgumentNullException(nameof(rng));
            }

            var n = span.Length;
            while (n > 1)
            {
                n--;
                var k = rng.Next(n + 1);
                (span[k], span[n]) = (span[n], span[k]);
            }
        }

        /// <summary>
        ///     Shuffles an array in-place.
        /// </summary>
        public static void Shuffle<T>(this T[] array)
        {
            if (array == null)
            {
                throw new ArgumentNullException(nameof(array));
            }

            array.AsSpan().Shuffle(Random.Shared);
        }

        /// <summary>
        ///     Shuffles a List&lt;T&gt; in-place.
        /// </summary>
        public static void Shuffle<T>(this List<T> list)
        {
            if (list == null)
            {
                throw new ArgumentNullException(nameof(list));
            }

            CollectionsMarshal.AsSpan(list).Shuffle(Random.Shared);
        }

        /// <summary>
        ///     Returns a new list containing the elements of a source sequence in random order.
        /// </summary>
        public static List<T> InRandomOrder<T>(this IEnumerable<T> source)
        {
            if (source == null)
            {
                throw new ArgumentNullException(nameof(source));
            }

            var list = source.ToList();
            list.Shuffle();
            return list;
        }
    }
}

		
		
