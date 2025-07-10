using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using Umbraco.Extensions;

namespace Articulate.Models.ManagementApi
{
    /// <summary>
    /// Represents the data required to copy an existing theme to a new theme name.
    /// </summary>
    public class ThemeCopyModel : IValidatableObject
    {
        /// <summary>
        /// Gets or sets the name of the existing theme to copy.
        /// </summary>
        [Required(AllowEmptyStrings = false)]
        public string ThemeName { get; set; }

        /// <summary>
        /// Gets or sets the new name for the copied theme.
        /// </summary>
        [Required(AllowEmptyStrings = false)]
        public string NewThemeName { get; set; }

        /// <summary>
        /// Validates that the new theme name does not contain invalid file name characters.
        /// </summary>
        /// <param name="validationContext">The context in which the validation is performed.</param>
        /// <returns>A collection of validation results.</returns>
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (Path.GetInvalidFileNameChars().ContainsAny(NewThemeName.ToCharArray()))
            {
                yield return new ValidationResult("Name cannot contain invalid file name characters", [nameof(ThemeName)
                ]);
            }
        }
    }
}
