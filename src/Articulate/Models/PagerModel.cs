#nullable enable
namespace Articulate.Models
{
    public class PagerModel
    {
        public PagerModel(int pageSize, int currentIndex, int totalPages, string? nextUrl = "", string? previousUrl = "")
        {
            PageSize = pageSize;
            CurrentPageIndex = currentIndex;
            TotalPages = totalPages;
            NextUrl = nextUrl;
            PreviousUrl = previousUrl;
        }

        public int PageSize { get; }

        public int TotalPages { get; }

        public int CurrentPageIndex { get; }

        public string? NextUrl { get; }

        public string? PreviousUrl { get; }

        public bool HasNext => NextUrl is not null;

        public bool HasPrevious => PreviousUrl is not null;
    }
}
