

namespace Articulate.Web.Models
{
    public class MarkdownEditorInitModel
    {
        public const string AuthorizeUrl = "/umbraco/management/api/v1/security/back-office/authorize";
        public const string CurrentUserUrl = "/umbraco/management/api/v1/user/current";
        public const string EndSessionUrl = "/umbraco/management/api/v1/security/back-office/signout";
        public const string TokenUrl = "/umbraco/management/api/v1/security/back-office/token";

        public int ArticulateBlogNode { get; set; }

        public string? EditorPostUrl { get; set; }

        public string? BackOfficeClientId { get; set; }

        public bool IsBackOfficeLoggedIn { get; set; }

        public string? BackOfficeUserName { get; set; }

        public int? BackOfficeUserId { get; set; }

        public bool HasRequiredPermissions { get; set; }

    }
}
