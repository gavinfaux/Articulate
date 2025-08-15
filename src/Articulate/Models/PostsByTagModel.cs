#nullable enable
namespace Articulate.Models
{
    public class PostsByTagModel
    {
        private int? _count;

        public PostsByTagModel(IEnumerable<PostModel> posts, string tagName, string tagUrl, int count = -1)
        {
            ArgumentNullException.ThrowIfNull(posts, nameof(posts));

            ArgumentNullException.ThrowIfNull(tagUrl, nameof(tagUrl));

            // resolve to array so it doesn't double lookup
            Posts = posts.ToArray();
            TagName = tagName ?? throw new ArgumentNullException(nameof(tagName));
            var safeEncoded = tagUrl.SafeEncodeUrlSegments();
            TagUrl = safeEncoded.Contains("//") ? safeEncoded : safeEncoded.EnsureStartsWith('/');
            if (count > -1)
            {
                _count = count;
            }
        }

        public IEnumerable<PostModel>? Posts { get; }

        public string TagName { get; }

        public string TagUrl { get; }

        /// <summary>
        /// Gets an string that can represent an html id for the tag
        /// </summary>
        public string HtmlId => TagName.SafeEncodeUrlSegments();

        public int PostCount
        {
            get
            {
                if (_count.HasValue == false)
                {
                    _count = (Posts ?? []).Count();
                }

                return _count.Value;
            }
        }
    }
}
