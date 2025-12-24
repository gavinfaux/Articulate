#nullable enable
using System.Collections;

namespace Articulate.Models
{
    public class PostTagCollection(IEnumerable<PostsByTagModel> tags) : IEnumerable<PostsByTagModel>
    {
        private int? _maxCount;

        /// <summary>
        /// Returns a tag weight based on the current tag collection out of x
        /// </summary>
        /// <param name="postsByTag"></param>
        /// <param name="maxWeight"></param>
        /// <returns></returns>
        public int GetTagWeight(PostsByTagModel postsByTag, decimal maxWeight)
        {
            _maxCount ??= this.DefaultIfEmpty().Max(x => x?.PostCount ?? 0);

            if (_maxCount.Value == 0)
            {
                return 0;
            }

            return Convert.ToInt32(Math.Ceiling(postsByTag.PostCount * maxWeight / _maxCount.Value));
        }

        /// <inheritdoc/>
        public IEnumerator<PostsByTagModel> GetEnumerator() => tags.GetEnumerator();

        /// <inheritdoc/>
        IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
    }
}
