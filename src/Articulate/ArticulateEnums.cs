using System;
using System.Reflection;

namespace Articulate
{
    public static class ArticulateEnum
    {
        public enum ManagementApi
        {
            [StringValue(ArticulateConstants.ManagementApi.Authentication)]
            Authentication,

            [StringValue(ArticulateConstants.ManagementApi.BlogMl)]
            BlogML,

            [StringValue(ArticulateConstants.ManagementApi.ThemePicker)]
            MarkdownEditor,

            [StringValue(ArticulateConstants.ManagementApi.Authentication)]
            ThemePicker,

            [StringValue(ArticulateConstants.ManagementApi.ThemeOptions)]
            Template
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
            var stringValueAttribute = memberInfo.GetCustomAttribute<StringValueAttribute>(inherit: false);

            // Return the attribute's value, or fall back to the enum member's name
            return stringValueAttribute?.Value ?? enumValue.ToString();
        }
    }
}
