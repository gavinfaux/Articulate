// Nullable reference annotations are used for the optional fields exposed to the view.
#nullable enable
namespace Articulate.Models
{
    public class MarkdownEditorInitModel
    {
        public required string AuthorizeUrl { get; set; }

        public required string CurrentUserUrl { get; set; }

        public required string EndSessionUrl { get; set; }

        public required string TokenUrl { get; set; }

        public required string RevocationUrl { get; set; }

        public required string LoginLogoUrl { get; set; }

        public required int ArticulateBlogNode { get; set; }

        public required string EditorPostUrl { get; set; }

        public required string BackOfficeClientId { get; set; }

        public string? PostLogoutRedirectUrl { get; set; }

    }
}
