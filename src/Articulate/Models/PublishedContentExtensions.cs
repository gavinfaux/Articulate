using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
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
        ///     Shuffles a List<T> in-place.
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
