using System.Runtime.Serialization;

namespace Articulate.Models.ManagmentApi.Authentication
{
    /// <summary>
    /// Represents the CSRF token response.
    /// </summary>
    [DataContract]
    public class CsrfTokenResponse
    {
        /// <summary>
        /// Gets the CSRF request token.
        /// </summary>
        public string RequestToken { get; init; } = string.Empty;
    }
}
