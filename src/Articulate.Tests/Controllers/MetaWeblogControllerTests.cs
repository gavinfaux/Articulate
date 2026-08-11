#nullable enable
using Articulate.Controllers;
using NUnit.Framework;

namespace Articulate.Tests.Controllers
{
    [TestFixture]
    public class MetaWeblogControllerTests
    {
        [Test]
        public void TryNormalizeMetaWeblogRequest_returns_true_for_valid_method_call()
        {
            const string content = """
                <?xml version="1.0"?>
                <methodCall>
                  <methodName>blogger.getUsersBlogs</methodName>
                  <params><param><value>key</value></param></params>
                </methodCall>
                """;

            Assert.That(MetaWeblogController.TryNormalizeMetaWeblogRequest(content, 1000, out _), Is.True);
        }

        [Test]
        public void TryNormalizeMetaWeblogRequest_normalizes_wordpress_discovery_fallback()
        {
            const string content = """
                <methodCall>
                  <methodName>wp.getUsersBlogs</methodName>
                  <params>
                    <param><value><string>editor</string></value></param>
                    <param><value><string>password</string></value></param>
                  </params>
                </methodCall>
                """;

            Assert.That(MetaWeblogController.TryNormalizeMetaWeblogRequest(content, 1000, out string normalized), Is.True);
            Assert.That(normalized, Does.Contain("<methodName>blogger.getUsersBlogs</methodName>"));
            Assert.That(normalized, Does.Contain("<params><param><value><string></string></value></param>"));
            Assert.That(normalized.Split("<param>"), Has.Length.EqualTo(4));
        }

        [Test]
        public void TryNormalizeMetaWeblogRequest_returns_false_when_root_is_not_methodCall()
        {
            const string content = """
                <?xml version="1.0"?>
                <methodResponse>
                  <params><param><value>ok</value></param></params>
                </methodResponse>
                """;

            Assert.That(MetaWeblogController.TryNormalizeMetaWeblogRequest(content, 1000, out _), Is.False);
        }

        [Test]
        public void TryNormalizeMetaWeblogRequest_returns_false_when_methodName_element_is_absent()
        {
            const string content = """
                <?xml version="1.0"?>
                <methodCall>
                  <params><param><value>key</value></param></params>
                </methodCall>
                """;

            Assert.That(MetaWeblogController.TryNormalizeMetaWeblogRequest(content, 1000, out _), Is.False);
        }

        [Test]
        public void TryNormalizeMetaWeblogRequest_returns_false_for_malformed_xml()
        {
            const string content = "<methodCall><methodName>foo</not-closed>";

            Assert.That(MetaWeblogController.TryNormalizeMetaWeblogRequest(content, 1000, out _), Is.False);
        }

        [Test]
        public void TryNormalizeMetaWeblogRequest_returns_false_for_empty_string()
        {
            Assert.That(MetaWeblogController.TryNormalizeMetaWeblogRequest(string.Empty, 1000, out _), Is.False);
        }

        [Test]
        public void TryNormalizeMetaWeblogRequest_returns_false_for_plain_text()
        {
            Assert.That(MetaWeblogController.TryNormalizeMetaWeblogRequest("not xml at all", 1000, out _), Is.False);
        }

        [Test]
        public void TryNormalizeMetaWeblogRequest_rejects_doctype()
        {
            const string content = "<!DOCTYPE methodCall [<!ENTITY x 'expanded'>]><methodCall><methodName>&x;</methodName></methodCall>";

            Assert.That(MetaWeblogController.TryNormalizeMetaWeblogRequest(content, 1000, out _), Is.False);
        }

        [Test]
        public void TryNormalizeMetaWeblogRequest_rejects_character_limit()
        {
            const string content = "<methodCall><methodName>blogger.getUsersBlogs</methodName></methodCall>";

            Assert.That(MetaWeblogController.TryNormalizeMetaWeblogRequest(content, 10, out _), Is.False);
        }
    }
}
