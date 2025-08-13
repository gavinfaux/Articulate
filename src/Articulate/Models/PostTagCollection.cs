#nullable enable
using System.Collections;

namespace Articulate.Models;

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
        if (_maxCount.HasValue == false)
        {
            _maxCount = this.Max(x => x.PostCount);
        }

        return Convert.ToInt32(Math.Ceiling(postsByTag.PostCount * maxWeight / _maxCount.Value));
    }

    public IEnumerator<PostsByTagModel> GetEnumerator() => tags.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
