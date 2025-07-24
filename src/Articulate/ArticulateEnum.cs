using System;
using System.Reflection;
using Articulate.Attributes;

namespace Articulate
{
    public static class ArticulateEnum
    {
        public enum ManagementApi
        {
            [StringValue(ArticulateConstants.ManagementApi.BlogMl)]
            BlogMl,

            [StringValue(ArticulateConstants.ManagementApi.MarkdownEditor)]
            MarkdownEditor,

            [StringValue(ArticulateConstants.ManagementApi.ThemePicker)]
            ThemePicker,

            [StringValue(ArticulateConstants.ManagementApi.ThemeOptions)]
            ThemeOptions
        }

        public static string GetStringValue(this Enum enumValue)
        {
            // Get the MemberInfo object for the enum member
            var memberInfo = enumValue.GetType().GetField(enumValue.ToString());
            if (memberInfo == null)
            {
                return enumValue.ToString();
            }

            // Get the StringValueAttribute from the member
            var stringValueAttribute = memberInfo.GetCustomAttribute<StringValueAttribute>(false);

            // Return the attribute's value, or fall back to the enum member's name
            return stringValueAttribute?.Value ?? enumValue.ToString();
        }
    }
}
