#nullable enable
using System.Xml.Linq;
using NUnit.Framework;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using static Articulate.Tests.ImportExport.BlogMlImportFixture;

namespace Articulate.Tests.ImportExport;

[TestFixture]
public class BlogMlImportTests
{
    [TestCase("Other", null, "hello", false)]
    [TestCase("Hello", null, "hello (1)", false)]
    [TestCase("Hello", " Hello-1 ", "hello (2)", false)]
    [TestCase(" ", null, "hello", false)]
    [TestCase("Hello", " Hello-1 ", "hello (2)", true)]
    public async Task Import_indexes_sibling_names_and_normalised_url_segments(string siblingName, string? siblingUrlName, string expected, bool variesByCulture)
    {
        using var fixture = new BlogMlImportFixture(variesByCulture);
        IContent archive = fixture.AddArchive("Articles");
        _ = fixture.AddPost(archive, siblingName, "existing");
        _ = fixture.AddPost(archive, "Unrelated", "other", siblingUrlName);
        await fixture.ImportAsync(false, posts: Post("new"));
        IContent added = fixture.Posts.Single(x => x.GetValue<string>("importId", fixture.Culture) == "new");
        Assert.That(fixture.Persisted[added.Key].GetValue<string>("umbracoUrlName", fixture.Culture), Is.EqualTo(expected));
    }

    [TestCase(false)]
    [TestCase(true)]
    public async Task Import_creates_then_reimports_without_copy_or_url_change(bool variesByCulture)
    {
        using var fixture = new BlogMlImportFixture(variesByCulture);
        IContent archive = fixture.AddArchive("Articles");
        await fixture.ImportAsync(false, posts: Post("p1"));
        IContent post = fixture.Posts.Single();
        Assert.That(post.ParentId, Is.EqualTo(archive.Id));
        Assert.That(post.GetValue<string>("importId", fixture.Culture), Is.EqualTo("p1"));
        post.SetValue("umbracoUrlName", "hello (2)", fixture.Culture);
        _ = fixture.ContentService.Object.Save(post, 7);
        int savesBeforeSkip = fixture.Saved.Count;
        await fixture.ImportAsync(false, posts: Post("p1", body: "skipped"));
        Assert.That(fixture.Saved.Count, Is.EqualTo(savesBeforeSkip));
        Assert.That(post.GetValue<string>("richText", fixture.Culture), Is.EqualTo("updated"));
        Assert.That(fixture.Persisted[post.Key].GetValue<string>("richText", fixture.Culture), Is.EqualTo("updated"));
        await fixture.ImportAsync(true, posts: Post("p1", body: "replaced"));
        Assert.That(fixture.Posts.Single(), Is.SameAs(post));
        Assert.That(fixture.Persisted[post.Key].GetValue<string>("richText", fixture.Culture), Is.EqualTo("replaced"));
        Assert.That(fixture.Persisted[post.Key].GetValue<string>("umbracoUrlName", fixture.Culture), Is.EqualTo("hello (2)"));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    [TestCase(false, true)]
    [TestCase(true, true)]
    public async Task Missing_import_id_matches_exact_normalised_target_slug(bool overwrite, bool variesByCulture)
    {
        using var fixture = new BlogMlImportFixture(variesByCulture);
        IContent archive = fixture.AddArchive("Articles");
        IContent existing = fixture.AddPost(archive, "Unrelated title", urlName: " Hello World ");
        await fixture.ImportAsync(overwrite, posts: Post("p1", "hello-world"));
        Assert.That(fixture.Posts.Single(), Is.SameAs(existing));
        Assert.That(fixture.Saved.Contains(existing), Is.EqualTo(overwrite));
        Assert.That(existing.GetValue<string>("importId", fixture.Culture), Is.EqualTo(overwrite ? "p1" : null));
        IContent saved = fixture.Persisted[existing.Key];
        Assert.That(saved.GetValue<string>("importId", fixture.Culture), Is.EqualTo(overwrite ? "p1" : null));
        Assert.That(saved.GetValue<string>("richText", fixture.Culture), Is.EqualTo(overwrite ? "updated" : "original"));
        Assert.That(saved.GetValue<string>("umbracoUrlName", fixture.Culture), Is.EqualTo(" Hello World "));
        await fixture.ImportAsync(overwrite, posts: Post("p1", "hello-world", "repeat"));
        Assert.That(fixture.Posts.Single(), Is.SameAs(existing));
        Assert.That(fixture.Persisted[existing.Key].GetValue<string>("umbracoUrlName", fixture.Culture), Is.EqualTo(" Hello World "));
    }

    [TestCase(false)]
    [TestCase(true)]
    public async Task Different_import_id_is_never_adopted_and_skipped_slug_stays_taken(bool overwrite)
    {
        using var fixture = new BlogMlImportFixture();
        IContent archive = fixture.AddArchive("Articles");
        IContent existing = fixture.AddPost(archive, "Hello", "other");
        await fixture.ImportAsync(overwrite, posts: [Post("other", "Hello", "skip-or-update"), Post("new", "hello")]);
        Assert.That(fixture.Posts.Count(), Is.EqualTo(2));
        IContent added = fixture.Posts.Single(x => x != existing);
        Assert.That(added.GetValue<string>("umbracoUrlName"), Is.EqualTo("hello (1)"));
        Assert.That(existing.GetValue<string>("importId"), Is.EqualTo("other"));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    [TestCase(false, true)]
    [TestCase(true, true)]
    public async Task Same_id_twice_in_one_file_reuses_saved_post(bool overwrite, bool marked)
    {
        using var fixture = new BlogMlImportFixture();
        IContent archive = fixture.AddArchive("Articles");
        await fixture.ImportAsync(overwrite, posts: [Post("same", "first", "first", marked ? archive.Key : null), Post("same", "second", "second", marked ? archive.Key : null)]);
        IContent post = fixture.Posts.Single();
        Assert.That(fixture.Persisted[post.Key].GetValue<string>("richText"), Is.EqualTo(overwrite ? "second" : "first"));
        Assert.That(fixture.Persisted[post.Key].GetValue<string>("umbracoUrlName"), Is.EqualTo("first"));
    }

    [TestCase(false)]
    [TestCase(true)]
    public async Task Marked_id_is_rootwide_but_unmarked_id_is_target_only(bool marked)
    {
        using var fixture = new BlogMlImportFixture();
        IContent target = fixture.AddArchive("Articles");
        IContent owner = fixture.AddArchive("Elsewhere");
        IContent existing = fixture.AddPost(owner, "Other", "p1", "kept");
        await fixture.ImportAsync(true, posts: Post("p1", archiveKey: marked ? Guid.NewGuid() : null, archiveName: marked ? "Absent" : null));
        Assert.That(fixture.Archives.Count(), Is.EqualTo(2));
        Assert.That(existing.ParentId, Is.EqualTo(owner.Id));
        Assert.That(fixture.Persisted[existing.Key].GetValue<string>("richText"), Is.EqualTo(marked ? "updated" : "original"));
        Assert.That(fixture.Persisted[existing.Key].GetValue<string>("umbracoUrlName"), Is.EqualTo("kept"));
        Assert.That(fixture.Posts.Count(), Is.EqualTo(marked ? 1 : 2));
        if (!marked)
        {
            Assert.That(fixture.Posts.Single(x => x != existing).ParentId, Is.EqualTo(target.Id));
        }
    }

    [TestCase(false)]
    [TestCase(true)]
    public async Task Root_url_without_post_name_does_not_abort_following_post(bool variesByCulture)
    {
        using var fixture = new BlogMlImportFixture(variesByCulture);
        _ = fixture.AddArchive("Articles");
        await fixture.ImportAsync(false, posts: [Post("root", null, url: "/"), Post("valid", "valid")]);
        Assert.That(fixture.Posts.Select(x => x.GetValue<string>("importId", fixture.Culture)), Is.EquivalentTo(new[] { "root", "valid" }));
        IContent rootPost = fixture.Posts.Single(x => x.GetValue<string>("importId", fixture.Culture) == "root");
        Assert.That(variesByCulture ? rootPost.GetCultureName(fixture.Culture) : rootPost.Name, Is.EqualTo("Title"));
    }

    [TestCase(false)]
    [TestCase(true)]
    public async Task New_archive_obeys_publish_all_through_import(bool publishAll)
    {
        using var fixture = new BlogMlImportFixture();
        var sourceKey = Guid.NewGuid();
        await fixture.ImportAsync(false, publishAll, Post("p1", archiveKey: sourceKey, archiveName: "News"));
        IContent archive = fixture.Archives.Single();
        Assert.That(archive.Key, Is.EqualTo(sourceKey));
        Assert.That(archive.Name, Is.EqualTo("News"));
        Assert.That(fixture.Posts.Single().ParentId, Is.EqualTo(archive.Id));
        Assert.That(fixture.Saved, Does.Contain(archive));
        Assert.That(fixture.Published.Contains(archive), Is.EqualTo(publishAll));
        fixture.ContentService.Verify(
            x => x.Publish(archive, Moq.It.Is<string[]>(cultures => cultures.SequenceEqual(new[] { "*" })), 7),
            publishAll ? Moq.Times.Once() : Moq.Times.Never());
    }

    [TestCase(false)]
    [TestCase(true)]
    public async Task Distinct_keyed_same_name_archives_keep_placement_on_repeat_and_new_first(bool reverse)
    {
        using var fixture = new BlogMlImportFixture();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        XElement[] first = [Post("a", archiveKey: a, archiveName: "News"), Post("b", archiveKey: b, archiveName: " news ")];
        await fixture.ImportAsync(false, posts: reverse ? [.. first.Reverse()] : first);
        Assert.That(fixture.Archives.Count(), Is.EqualTo(2));
        Assert.That(fixture.Posts.Single(x => x.GetValue<string>("importId") == "a").ParentId, Is.EqualTo(fixture.Archives.Single(x => x.Key == a).Id));
        Assert.That(fixture.Posts.Single(x => x.GetValue<string>("importId") == "b").ParentId, Is.EqualTo(fixture.Archives.Single(x => x.Key == b).Id));
        fixture.Archives.Single(x => x.Key == b).Name = "Renamed destination";
        await fixture.ImportAsync(true, posts: [Post("new-b", "new", archiveKey: b, archiveName: "news"), .. first.Reverse()]);
        await fixture.ImportAsync(true, posts: Post("new-a", "new", archiveKey: a, archiveName: "News"));
        Assert.That(fixture.Archives.Count(), Is.EqualTo(2));
        Assert.That(fixture.Posts.Count(), Is.EqualTo(4));
        Assert.That(fixture.Posts.Single(x => x.GetValue<string>("importId") == "new-b").ParentId, Is.EqualTo(fixture.Archives.Single(x => x.Key == b).Id));
        Assert.That(fixture.Posts.Single(x => x.GetValue<string>("importId") == "new-a").ParentId, Is.EqualTo(fixture.Archives.Single(x => x.Key == a).Id));
    }

    [Test]
    public async Task Single_source_unique_name_fallback_keeps_existing_key_and_name_only_marker_works()
    {
        using var fixture = new BlogMlImportFixture();
        IContent archive = fixture.AddArchive("News");
        Guid key = archive.Key;
        await fixture.ImportAsync(false, posts: [Post("keyed", archiveKey: Guid.NewGuid(), archiveName: " news "), Post("named", "named", archiveName: "NEWS")]);
        Assert.That(fixture.Archives.Single(), Is.SameAs(archive));
        Assert.That(archive.Key, Is.EqualTo(key));
        Assert.That(fixture.Posts.Select(x => x.ParentId), Is.All.EqualTo(archive.Id));
    }

    [TestCase(false, false)]
    [TestCase(true, false)]
    [TestCase(false, true)]
    [TestCase(true, true)]
    public async Task Renamed_name_fallback_rejects_destination_claimed_by_another_marked_source(bool reverse, bool duplicateExistingId)
    {
        using var fixture = new BlogMlImportFixture();
        IContent destination = fixture.AddArchive("Sports");
        var sourceA = Guid.NewGuid();
        var sourceB = Guid.NewGuid();
        await fixture.ImportAsync(false, posts: Post("b", "b", "original body", sourceB, "Sports"));
        IContent existing = fixture.Posts.Single();
        Assert.That(fixture.Persisted[existing.Key].ParentId, Is.EqualTo(destination.Id));
        Assert.That(destination.Key, Is.Not.EqualTo(sourceB));
        destination.Name = "News";
        _ = fixture.ContentService.Object.Save(destination, 7);
        int savesBeforeImport = fixture.Saved.Count;
        List<XElement> input =
        [
            Post("a", "a", archiveKey: sourceA, archiveName: "News"),
            Post("b", "b", "must not overwrite", sourceB, "Sports"),
        ];
        if (duplicateExistingId)
        {
            input.Insert(1, Post("b", "b", archiveKey: sourceA, archiveName: "News"));
        }

        Articulate.ImportExport.BlogMlImportException? error = Assert.ThrowsAsync<Articulate.ImportExport.BlogMlImportException>(() =>
            fixture.ImportAsync(false, posts: reverse ? [.. input.AsEnumerable().Reverse()] : [.. input]));
        Assert.That(error!.Message, Does.Contain("ambiguous"));
        Assert.That(fixture.Archives.Single(), Is.SameAs(destination));
        Assert.That(fixture.Posts.Single(), Is.SameAs(existing));
        Assert.That(fixture.Persisted[existing.Key].ParentId, Is.EqualTo(destination.Id));
        Assert.That(fixture.Persisted[existing.Key].GetValue<string>("richText"), Is.EqualTo("original body"));
        Assert.That(fixture.Saved.Count, Is.EqualTo(savesBeforeImport));
    }

    [TestCase(false)]
    [TestCase(true)]
    public async Task Marked_ownership_claims_allow_same_source_fallback_and_exact_key_priority(bool exactKey)
    {
        using var fixture = new BlogMlImportFixture();
        IContent destination = fixture.AddArchive("Sports");
        var source = Guid.NewGuid();
        await fixture.ImportAsync(false, posts: Post("b", "b", "original body", source, "Sports"));
        destination.Name = "News";
        _ = fixture.ContentService.Object.Save(destination, 7);
        await fixture.ImportAsync(true, posts:
        [
            Post("a", "a", "new body", exactKey ? destination.Key : source, "News"),
            Post("b", "b", "updated body", source, "Sports"),
        ]);
        Assert.That(fixture.Archives.Single(), Is.SameAs(destination));
        Assert.That(fixture.Posts.Count(), Is.EqualTo(2));
        Assert.That(fixture.Posts.All(post => fixture.Persisted[post.Key].ParentId == destination.Id), Is.True);
        IContent existing = fixture.Posts.Single(post => post.GetValue<string>("importId") == "b");
        Assert.That(fixture.Persisted[existing.Key].GetValue<string>("richText"), Is.EqualTo("updated body"));
        IContent added = fixture.Posts.Single(post => post.GetValue<string>("importId") == "a");
        Assert.That(fixture.Persisted[added.Key].GetValue<string>("richText"), Is.EqualTo("new body"));
    }

    [TestCase(false)]
    [TestCase(true)]
    public async Task Saved_values_replace_stale_id_and_slug_indexes(bool clearSavedId)
    {
        using var fixture = new BlogMlImportFixture();
        IContent archive = fixture.AddArchive("Articles");
        IContent existing = fixture.AddPost(archive, "Original", "p1", "old");
        // Content-saving handlers may change properties. Index the returned saved values, not the input.
        fixture.ContentService.Setup(x => x.Save(existing, 7, null)).Returns(() =>
        {
            existing.SetValue("importId", clearSavedId ? null : "saved-id");
            existing.SetValue("umbracoUrlName", "saved-slug");
            fixture.Saved.Add(existing);
            fixture.Persisted[existing.Key] = (IContent)existing.DeepClone();
            return OperationResult.Succeed(new EventMessages());
        });
        await fixture.ImportAsync(true, posts:
            [Post("p1", "old", archiveKey: archive.Key),
             Post(clearSavedId ? "new-id" : "p1", clearSavedId ? "old" : "different", archiveKey: archive.Key),
             Post(clearSavedId ? "adopted" : "saved-id", "saved-slug", "last update", archive.Key)]);
        Assert.That(fixture.Posts.Count(), Is.EqualTo(2));
        Assert.That(existing.GetValue<string>("umbracoUrlName"), Is.EqualTo("saved-slug"));
        Assert.That(existing.GetValue<string>("richText"), Is.EqualTo("last update"));
        Assert.That(fixture.Posts.Single(x => x != existing).GetValue<string>("umbracoUrlName"), Is.EqualTo(clearSavedId ? "old" : "different"));
    }

    [Test]
    public async Task Keyed_markers_without_names_do_not_merge_through_default_archive_name()
    {
        using var fixture = new BlogMlImportFixture();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        await fixture.ImportAsync(false, posts: [Post("a", archiveKey: a), Post("b", archiveKey: b)]);
        await fixture.ImportAsync(false, posts: Post("new-b", "new", archiveKey: b));
        Assert.That(fixture.Archives.Select(x => x.Key), Is.EquivalentTo(new[] { a, b }));
        Assert.That(fixture.Posts.Single(x => x.GetValue<string>("importId") == "new-b").ParentId, Is.EqualTo(fixture.Archives.Single(x => x.Key == b).Id));
    }

    [Test]
    public async Task Archive_name_that_looks_like_another_source_key_does_not_share_creation_cache()
    {
        using var fixture = new BlogMlImportFixture();
        var key = Guid.NewGuid();
        await fixture.ImportAsync(false, posts: [Post("keyed", archiveKey: key, archiveName: "News"), Post("named", archiveName: key.ToString("D"))]);
        Assert.That(fixture.Archives.Count(), Is.EqualTo(2));
        Assert.That(fixture.Posts.Single(x => x.GetValue<string>("importId") == "named").ParentId, Is.EqualTo(fixture.Archives.Single(x => x.Name == key.ToString("D")).Id));
    }

    [Test]
    public void Distinct_keys_cannot_claim_one_existing_archive_even_when_exact_key_appears_later()
    {
        using var fixture = new BlogMlImportFixture();
        IContent archive = fixture.AddArchive("News");
        Assert.ThrowsAsync<Articulate.ImportExport.BlogMlImportException>(() => fixture.ImportAsync(false, posts:
            [Post("unknown", archiveKey: Guid.NewGuid(), archiveName: "News"), Post("exact", archiveKey: archive.Key, archiveName: "Old name")]));
        Assert.That(fixture.Posts, Is.Empty);
        Assert.That(fixture.Archives.Single(), Is.SameAs(archive));
    }

    [Test]
    public void Whole_file_conflict_check_includes_markers_on_duplicate_post_ids()
    {
        using var fixture = new BlogMlImportFixture();
        _ = fixture.AddArchive("News");
        Assert.ThrowsAsync<Articulate.ImportExport.BlogMlImportException>(() => fixture.ImportAsync(false, posts:
            [Post("same", archiveKey: Guid.NewGuid(), archiveName: "News"), Post("same", archiveKey: Guid.NewGuid(), archiveName: "News")]));
        Assert.That(fixture.Posts, Is.Empty);
    }

    [TestCase(false)]
    [TestCase(true)]
    public void Same_install_source_key_collision_errors_without_changing_original_blog(bool reverse)
    {
        using var fixture = new BlogMlImportFixture();
        IContent originalRoot = fixture.AddContent("Original", -1, ArticulateConstants.ContentType.Articulate);
        IContent originalA = fixture.AddArchive("News", root: originalRoot);
        IContent originalB = fixture.AddArchive("news", root: originalRoot);
        IContent originalPost = fixture.AddPost(originalA, "Original post", "a", "original-url");
        XElement[] input = [Post("a", archiveKey: originalA.Key, archiveName: "News"), Post("b", archiveKey: originalB.Key, archiveName: "news")];
        Articulate.ImportExport.BlogMlImportException? error = Assert.ThrowsAsync<Articulate.ImportExport.BlogMlImportException>(() => fixture.ImportAsync(true, posts: reverse ? [.. input.Reverse()] : input));
        Assert.That(error!.Message, Does.Contain("archive key").And.Contain("selected blog"));
        Assert.That(fixture.Archives, Is.Empty);
        Assert.That(originalA.ParentId, Is.EqualTo(originalRoot.Id));
        Assert.That(originalB.ParentId, Is.EqualTo(originalRoot.Id));
        Assert.That(originalPost.GetValue<string>("richText"), Is.EqualTo("original"));
        Assert.That(originalPost.GetValue<string>("umbracoUrlName"), Is.EqualTo("original-url"));
        Assert.That(fixture.Saved, Does.Not.Contain(originalA).And.Not.Contain(originalB).And.Not.Contain(originalPost));
    }

    [TestCase(false)]
    [TestCase(true)]
    public void Ambiguous_existing_destinations_reject_new_first_even_when_source_keys_are_free(bool reverse)
    {
        using var fixture = new BlogMlImportFixture();
        IContent first = fixture.AddArchive("News");
        IContent second = fixture.AddArchive("NEWS");
        _ = fixture.AddPost(first, "Old", "old");
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        XElement[] input = [Post("new", archiveKey: a, archiveName: "News"), Post("old", archiveKey: b, archiveName: "news")];
        Articulate.ImportExport.BlogMlImportException? error = Assert.ThrowsAsync<Articulate.ImportExport.BlogMlImportException>(() => fixture.ImportAsync(false, posts: reverse ? [.. input.Reverse()] : input));
        Assert.That(error!.Message, Does.Contain("ambiguous"));
        Assert.That(fixture.Archives.Count(), Is.EqualTo(2));
        Assert.That(fixture.Posts.Count(), Is.EqualTo(1));
        Assert.That(second.ParentId, Is.EqualTo(fixture.Root.Id));
    }

}
