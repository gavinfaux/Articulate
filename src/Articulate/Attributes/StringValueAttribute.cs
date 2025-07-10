using System;

/// <summary>
/// A simple attribute to associate a string value with an enum member.
/// </summary>
[AttributeUsage(AttributeTargets.Field, AllowMultiple = false)]
public class StringValueAttribute : Attribute
{
    public string Value { get; }

    public StringValueAttribute(string value)
    {
        Value = value;
    }
}
