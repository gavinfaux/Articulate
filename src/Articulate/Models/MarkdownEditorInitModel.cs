// Nullable reference annotations are used for the optional fields exposed to the view.
#nullable enable
namespace Articulate.Models
{
    public class MarkdownEditorInitModel
    {
        public const string AuthorizeUrl = "/umbraco/management/api/v1/security/back-office/authorize";
        public const string CurrentUserUrl = "/umbraco/management/api/v1/user/current";
        public const string EndSessionUrl = "/umbraco/management/api/v1/security/back-office/signout";
        public const string TokenUrl = "/umbraco/management/api/v1/security/back-office/token";
        public const string RevocationUrl = "/umbraco/management/api/v1/security/back-office/revoke";

        public int ArticulateBlogNode { get; set; }

        public string? EditorPostUrl { get; set; }

        public string? BackOfficeClientId { get; set; }

        public bool IsBackOfficeLoggedIn { get; set; }

        public string? PostLogoutRedirectUrl { get; set; }

        public bool UseCookieAuth { get; set; }
    }
}
