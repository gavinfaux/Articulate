using System.Xml;
using System.Xml.XPath;
using Argotic.Common;
using Argotic.Extensions;

namespace Articulate.Syndication.BlogML
{
    public class TagsSyndicationExtension : SyndicationExtension, IComparable
    {
        public const string Namespace = "https://github.com/Shazwazza/Articulate/blogml/";

        private TagsSyndicationExtensionContext _extensionContext = new TagsSyndicationExtensionContext();

        public TagsSyndicationExtension()
            : base("tags", Namespace, new Version("1.0"))
        {
        }

        public TagsSyndicationExtensionContext Context
        {
            get => _extensionContext;
            set
            {
                Guard.ArgumentNotNull(value, "value");
                _extensionContext = value;
            }
        }

        public int CompareTo(object obj)
        {
            if (obj == null)
            {
                return 1;
            }

            if (obj is TagsSyndicationExtension syndicationExtension)
            {
                return
                    string.Compare(Description, syndicationExtension.Description, StringComparison.OrdinalIgnoreCase) |
                    Uri.Compare(Documentation, syndicationExtension.Documentation, UriComponents.AbsoluteUri, UriFormat.SafeUnescaped, StringComparison.OrdinalIgnoreCase) |
                    string.Compare(Name, syndicationExtension.Name, StringComparison.OrdinalIgnoreCase) |
                    Version.CompareTo(syndicationExtension.Version) |
                    string.Compare(XmlNamespace, syndicationExtension.XmlNamespace, StringComparison.Ordinal) |
                    string.Compare(XmlPrefix, syndicationExtension.XmlPrefix, StringComparison.Ordinal) |
                    ComparisonUtility.CompareSequence(Context.Tags, syndicationExtension.Context.Tags, StringComparison.OrdinalIgnoreCase);
            }

            throw new ArgumentException(
                string.Format(null, "obj is not of type {0}, type was found to be '{1}'.", GetType().FullName,obj.GetType().FullName),
                nameof(obj));
        }

        /// <inheritdoc />
        public override bool Load(IXPathNavigable source)
        {
            Guard.ArgumentNotNull(source, "source");
            XPathNavigator navigator = source.CreateNavigator();
            var flag = Context.Load(navigator, CreateNamespaceManager(navigator));
            OnExtensionLoaded(new SyndicationExtensionLoadedEventArgs(source, this));
            return flag;
        }

        /// <inheritdoc />
        public override bool Load(XmlReader reader)
        {
            Guard.ArgumentNotNull(reader, "reader");
            return Load(new XPathDocument(reader).CreateNavigator());
        }

        /// <inheritdoc />
        public override void WriteTo(XmlWriter writer)
        {
            Guard.ArgumentNotNull(writer, "writer");
            Context.WriteTo(writer, XmlNamespace);
        }

        public override string ToString()
        {
            using (var memoryStream = new MemoryStream())
            {
                using (var writer = XmlWriter.Create(memoryStream, new XmlWriterSettings
                {
                    ConformanceLevel = ConformanceLevel.Fragment,
                    Indent = true,
                    OmitXmlDeclaration = true
                }))
                {
                    WriteTo(writer);
                }

                memoryStream.Seek(0L, SeekOrigin.Begin);
                using (var streamReader = new StreamReader(memoryStream))
                {
                    return streamReader.ReadToEnd();
                }
            }
        }

        public override bool Equals(object obj)
        {
            if (!(obj is TagsSyndicationExtension))
            {
                return false;
            }

            return CompareTo(obj) == 0;
        }

        public override int GetHashCode() => ToString().ToCharArray().GetHashCode();
    }
}
