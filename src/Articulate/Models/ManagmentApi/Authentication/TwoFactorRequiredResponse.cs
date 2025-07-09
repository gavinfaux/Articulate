namespace Articulate.Models.ManagmentApi.Authentication
{
    public class TwoFactorRequiredResponse : LoginResponseBase
    {
        /// <summary>
        /// Gets the URL to redirect the user for two-factor authentication.
        /// </summary>
        public string RedirectUrl { get; init; } = string.Empty;
    }
}
