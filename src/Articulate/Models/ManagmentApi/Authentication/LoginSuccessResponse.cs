using System.Runtime.Serialization;

namespace Articulate.Models.ManagmentApi.Authentication
{
    /// <summary>
    /// Represents the response returned upon successful login.
    /// </summary>
    [DataContract]
    public class LoginSuccessResponse
    {
        /// <summary>
        /// Gets a value indicating whether the login was successful.
        /// </summary>
        public bool Success { get; init; }
    }
}
