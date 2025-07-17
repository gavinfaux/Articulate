namespace Articulate.Models
{
    public class MarkdownEditorInitModel
    {
        public int ArticulateNodeId { get; set; }
        public string PostUrl { get; set; }

        public string AuthLoginUrl { get; set; }

        public string AuthLogoutUrl { get; set; }

        public string CsrfTokenUrl { get; set; }

        public string AuthStatusUrl { get; set; }
    }
}
