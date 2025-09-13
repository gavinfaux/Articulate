namespace Articulate.Web.Models
{
    public class MarkdownEditorInitModel
    {
        public const string AuthorizeUrl = "/umbraco/management/api/v1/security/back-office/authorize";
        public const string CurrentUserUrl = "/umbraco/management/api/v1/user/current";
        public const string EndSessionUrl = "/umbraco/management/api/v1/security/back-office/end-session";
        public const string TokenUrl = "/umbraco/management/api/v1/security/back-office/token";

        public int ArticulateNodeId { get; set; }

        public string? EditorPostUrl { get; set; }

        /// <summary>
        ///     Indicates whether the current request has a valid Umbraco back-office authentication cookie.
        ///     This is used by the Markdown editor view to optionally tailor the UX (e.g. showing a login prompt).
        /// </summary>
        public bool IsBackOfficeLoggedIn { get; set; }
    }
}
