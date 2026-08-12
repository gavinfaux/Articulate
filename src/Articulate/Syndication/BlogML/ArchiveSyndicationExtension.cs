#nullable enable
using System.Xml;
using System.Xml.XPath;
using Argotic.Common;
using Argotic.Extensions;

namespace Articulate.Syndication.BlogML;

/// <summary>
/// Carries the source Articulate archive identity for a BlogML post.
/// </summary>
public sealed class ArchiveSyndicationExtension() : SyndicationExtension("articulate", Namespace, new Version("1.0"))
{
    public const string Namespace = "https://github.com/Shazwazza/Articulate/blogml/";
    public const string ElementName = "archive";
    public const string KeyAttribute = "key";
    public const string NameAttribute = "name";

    public string? ArchiveIdentity { get; set; }
    public string? ArchiveName { get; set; }

    public override bool Load(IXPathNavigable source)
    {
        Guard.ArgumentNotNull(source, nameof(source));
        XPathNavigator? navigator = source.CreateNavigator();
        if (navigator is null)
        {
            return false;
        }

        XPathNavigator? archive = navigator.SelectSingleNode(
            $"a:{ElementName}",
            CreateNamespaceManager(navigator));
        ArchiveIdentity = archive?.GetAttribute(KeyAttribute, string.Empty);
        ArchiveName = archive?.GetAttribute(NameAttribute, string.Empty);
        return !string.IsNullOrWhiteSpace(ArchiveIdentity) || !string.IsNullOrWhiteSpace(ArchiveName);
    }

    public override bool Load(XmlReader reader)
    {
        Guard.ArgumentNotNull(reader, nameof(reader));
        return Load(new XPathDocument(reader).CreateNavigator());
    }

    public override void WriteTo(XmlWriter writer)
    {
        Guard.ArgumentNotNull(writer, nameof(writer));
        if (string.IsNullOrWhiteSpace(ArchiveIdentity))
        {
            return;
        }

        writer.WriteStartElement(ElementName, Namespace);
        writer.WriteAttributeString(KeyAttribute, ArchiveIdentity);
        if (!string.IsNullOrWhiteSpace(ArchiveName))
        {
            writer.WriteAttributeString(NameAttribute, ArchiveName);
        }
        writer.WriteEndElement();
    }
}
