namespace Articulate.Models.ManagementApi.Authentication
{
    public class LoginSuccessResponse : LoginResponseBase
    {
        /// <summary>
        /// Gets a value indicating whether the login was successful.
        /// </summary>
        public bool IsAuthenticated { get; init; } = true;
    }
}
