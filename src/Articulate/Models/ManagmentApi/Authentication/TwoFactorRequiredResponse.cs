using System.Runtime.Serialization;

namespace Articulate.Models.ManagmentApi.Authentication
{
    /// <summary>
    /// Represents the response when two-factor authentication is required.
    /// </summary>
    [DataContract]
    public class TwoFactorRequiredResponse
    {
        /// <summary>
        /// Gets a value indicating whether two-factor authentication is required.
        /// </summary>
        public bool RequiresTwoFactor { get; init; }

        /// <summary>
        /// Gets the URL to redirect the user for two-factor authentication.
        /// </summary>
        public string RedirectUrl { get; init; } = string.Empty;
    }
}
