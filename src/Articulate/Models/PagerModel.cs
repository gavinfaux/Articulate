namespace Articulate.Models
{
    public class PagerModel(
        int pageSize,
        int currentIndex,
        int totalPages,
        string nextUrl = null,
        string previousUrl = null)
    {
        public int PageSize { get; } = pageSize;

        public int TotalPages { get; } = totalPages;

        public int CurrentPageIndex { get; } = currentIndex;

        public string NextUrl { get; } = nextUrl;

        public string PreviousUrl { get; } = previousUrl;

        public bool HasNext => NextUrl != null;

        public bool HasPrevious => PreviousUrl != null;
    }
}
