using System;
using Articulate;
using Microsoft.AspNetCore.Mvc;
using static Articulate.ArticulateEnum;

[AttributeUsage(AttributeTargets.Class, AllowMultiple = true, Inherited = false)]
public sealed class ManagementApiAttribute : ApiExplorerSettingsAttribute
{
    public ManagementApi Group { get; }

    public ManagementApiAttribute(ManagementApi group)
    {
        Group = group;

        GroupName = group.GetStringValue();
    }
}
