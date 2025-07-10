namespace Articulate.Models.ManagementApi.Authentication
{
    /// <summary>
    /// Represents the authentication status response.
    /// </summary>
    public class StatusResponse
    {
        /// <summary>
        /// Gets a value indicating whether the user is authenticated.
        /// </summary>
        public bool IsAuthenticated { get; init; }
    }
}
