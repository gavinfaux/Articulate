#if UMBRACO_19_OR_GREATER
#nullable enable
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Search.Indexing;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Infrastructure.Search.PropertyValueHandlers;
using Umbraco.Extensions;

namespace Articulate
{
    /// <summary>
    /// Lifts Articulate post fields into CMS relevance tiers, roughly matching the legacy search weights.
    /// Core merges these fields with its own by name, so values are added on top of core's.
    /// </summary>
    public class ArticulatePostContentIndexer : IContentIndexer
    {
        private readonly IMarkdownToHtmlConverter _markdownToHtmlConverter;
        private readonly IHtmlIndexValueParser _htmlIndexValueParser;
        private readonly IJsonSerializer _jsonSerializer;
        private readonly ILogger<ArticulatePostContentIndexer> _logger;

        public ArticulatePostContentIndexer(
            IMarkdownToHtmlConverter markdownToHtmlConverter,
            IHtmlIndexValueParser htmlIndexValueParser,
            IJsonSerializer jsonSerializer,
            ILogger<ArticulatePostContentIndexer> logger)
        {
            _markdownToHtmlConverter = markdownToHtmlConverter;
            _htmlIndexValueParser = htmlIndexValueParser;
            _jsonSerializer = jsonSerializer;
            _logger = logger;
        }

        /// <inheritdoc/>
        public Task<IEnumerable<IndexField>> GetIndexFieldsAsync(IContentBase content, string?[] cultures, bool published, CancellationToken cancellationToken)
        {
            // shortcut: custom post types composing ArticulatePost aren't covered (ISimpleContentType has no compositions), check IContentTypeService if users ask.
            if (content.ContentType.Alias is not (ArticulateConstants.ContentType.ArticulateMarkdown or ArticulateConstants.ContentType.ArticulateRichText))
            {
                return Task.FromResult(Enumerable.Empty<IndexField>());
            }

            List<IndexField> fields = [];
            foreach (IProperty property in content.Properties)
            {
                string?[] propertyCultures = property.PropertyType.VariesByCulture() ? cultures : [null];
                foreach (string? culture in propertyCultures)
                {
                    // shortcut: segments ignored, Articulate posts don't vary by segment.
                    IndexValue? value = GetIndexValue(property.Alias, property.GetValue(culture, null, published));
                    if (value is not null)
                    {
                        fields.Add(new IndexField(property.Alias, value, culture, null));
                    }
                }
            }

            return Task.FromResult<IEnumerable<IndexField>>(fields);
        }

        private IndexValue? GetIndexValue(string alias, object? value)
        {
            if (value is null)
            {
                return null;
            }

            switch (alias)
            {
                case "umbracoUrlName" when value is string urlName && !string.IsNullOrWhiteSpace(urlName):
                    return new IndexValue { TextsR1 = [urlName] };

                case "tags" or "categories" when value is string tagValue && !string.IsNullOrWhiteSpace(tagValue):
                    // Core indexes tags as Keywords only (exact match); add them as free text too.
                    // shortcut: ignores the data type's custom CSV delimiter, read TagConfiguration if a non-comma delimiter shows up.
                    string[]? tags = tagValue.DetectIsJson()
                        ? _jsonSerializer.Deserialize<string[]>(tagValue)
                        : tagValue.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    return tags is { Length: > 0 } ? new IndexValue { TextsR3 = tags } : null;

                case "markdown" when value is string markdown && !string.IsNullOrWhiteSpace(markdown):
                    return BodyToR2(_htmlIndexValueParser.Parse(_markdownToHtmlConverter.ToHtml(markdown)));

                case "richText" when RichTextPropertyEditorHelper.TryParseRichTextEditorValue(value, _jsonSerializer, _logger, out RichTextEditorValue? richText):
                    return BodyToR2(_htmlIndexValueParser.Parse(richText.Markup));

                default:
                    return null;
            }
        }

        // Core already tiers headings; only the plain body text needs lifting.
        private static IndexValue? BodyToR2(IndexValue? parsed)
            => parsed?.Texts is { } texts && texts.Any() ? new IndexValue { TextsR2 = texts } : null;
    }
}
#endif
