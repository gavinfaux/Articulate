using System.ComponentModel.DataAnnotations;

namespace Articulate.Models.ManagementApi.Authentication
{
    /// <summary>
    /// Represents the login model for authentication.
    /// </summary>
    public class LoginModel
    {
        /// <summary>
        /// Gets the email address of the user.
        /// </summary>
        [Required(ErrorMessage = "Email Address is required.")]
        [EmailAddress(ErrorMessage = "Email Address must be a valid email address.")]
        public string EmailAddress
        {
            get;
            set;
        } = string.Empty;

        /// <summary>
        /// Gets the password of the user.
        /// </summary>
        [Required(ErrorMessage = "Password is required.")]
        public string Password
        {
            get;
            set;
        } = string.Empty;
    }
}
