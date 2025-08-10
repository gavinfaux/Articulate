#nullable enable

namespace Articulate.Web.Models
{
    public class MarkdownEditorInitModel
    {
        public const string AuthorizeUrl = "/umbraco/management/api/v1/security/back-office/authorize";
        public const string EndSessionUrl = "/umbraco/management/api/v1/security/back-office/end-session";
        public const string TokenUrl = "/umbraco/management/api/v1/security/back-office/token";
        public const string CurrentUserUrl = "/umbraco/management/api/v1/user/current";

        public int ArticulateNodeId { get; set; }

        public string? EditorPostUrl { get; set; }
    }
}
