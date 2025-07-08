namespace Articulate.Models
{
    public class MarkdownEditorInitModel
    {
        public int ArticulateNodeId { get; set; }
        public string PostUrl { get; set; }

        public string AuthSignInUrl { get; set; }

        public string AuthSignOutUrl { get; set; }

        public string AuthCsrfTokenUrl { get; set; }

        public string AuthStatusUrl { get; set; }
    }
}
