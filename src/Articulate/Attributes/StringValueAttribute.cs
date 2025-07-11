using System;

namespace Articulate.Attributes
{
    /// <summary>
    /// A simple attribute to associate a string value with an enum member.
    /// </summary>
    [AttributeUsage(AttributeTargets.Field)]
    public class StringValueAttribute(string value) : Attribute
    {
        public string Value { get; } = value;
    }
}
