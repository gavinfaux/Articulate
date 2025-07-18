namespace Articulate.Models
{
    public class MarkdownEditorInitModel
    {
        public int ArticulateNodeId { get; set; }
        public string EditorPostUrl { get; set; }

        public string AuthorizeUrl => "/umbraco/management/api/v1/security/back-office/authorize";

        public string EndSessionUrl => "/umbraco/management/api/v1/security/back-office/end-session";

        public string TokenUrl => "/umbraco/management/api/v1/security/back-office/token";

        public string CurrentUserUrl => "/umbraco/management/api/v1/user/current";
    }
}
