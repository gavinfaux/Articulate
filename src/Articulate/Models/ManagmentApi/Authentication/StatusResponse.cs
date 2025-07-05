using System.Runtime.Serialization;

namespace Articulate.Models.ManagmentApi.Authentication
{
    /// <summary>
    /// Represents the authentication status response.
    /// </summary>
    [DataContract]
    public class StatusResponse
    {
        /// <summary>
        /// Gets a value indicating whether the user is authenticated.
        /// </summary>
        public bool IsAuthenticated { get; init; }
    }
}
