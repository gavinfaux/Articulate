using NPoco;
using Umbraco.Cms.Core.Cache;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.PublishedCache;
using Umbraco.Cms.Infrastructure.Persistence.Repositories.Implement;
using Umbraco.Cms.Infrastructure.Scoping;
using Umbraco.Cms.Web.Common;

// TODO: #nullable enable
namespace Articulate.Services;

internal class ArticulateTagRepository(
    IScopeAccessor scopeAccessor,
    AppCaches appCaches,
    IPublishedValueFallback publishedValueFallback)
    : RepositoryBase(scopeAccessor, appCaches), IArticulateTagRepository
{
    /// <summary>
    /// Returns a list of all categories belonging to this articulate root
    /// </summary>
    /// <param name="masterModel"></param>
    /// <returns></returns>
    IEnumerable<string> IArticulateTagRepository.GetAllCategories(
        IMasterModel masterModel)
    {
        // TODO: We want to use the core for this but it's not available, this needs to be implemented: http://issues.umbraco.org/issue/U4-9290
        Sql sql = GetTagQuery($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}.id, {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}.tag, {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}.[group], Count(*) as NodeCount", masterModel)
            .Where($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}." + SqlSyntax.GetQuotedColumnName("group") + " = @tagGroup", new
            {
                tagGroup = ArticulateConstants.DataType.ArticulateCategories
            })
            .GroupBy($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}.id", $"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}.tag", $"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}." + SqlSyntax.GetQuotedColumnName("group") + string.Empty);

        IOrderedEnumerable<string> results = Database.Fetch<TagDto>(sql).Select(x => x.Tag).WhereNotNull().OrderBy(x => x);

        return results;
    }

    IEnumerable<PostsByTagModel> IArticulateTagRepository.GetContentByTags(
        UmbracoHelper helper,
        ITagQuery tagQuery,
        IMasterModel masterModel,
        string tagGroup,
        string baseUrlName)
    {
        TagModel[] tags = tagQuery.GetAllContentTags(tagGroup).ToArray();
        if (tags.Length == 0)
        {
            return [];
        }

        // TODO: We want to use the core for this but it's not available, this needs to be implemented: http://issues.umbraco.org/issue/U4-9290
        IEnumerable<PostsByTagModel> GetResult()
        {
            var taggedContent = new List<TagDto>();

            // process in groups to not exceed the max SQL params
            foreach (IEnumerable<TagModel> tagBatch in tags.InGroupsOf(2000))
            {
                Sql sql = GetTagQuery($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.TagRelationship}.nodeId, {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.TagRelationship}.tagId, {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}.tag", masterModel)
                    .Where("tagId IN (@tagIds) AND cmsTags." + SqlSyntax.GetQuotedColumnName("group") + " = @tagGroup", new
                    {
                        tagIds = tagBatch.Select(x => x.Id).ToArray(),
                        tagGroup
                    });

                List<TagDto> dbTags = Database.Fetch<TagDto>(sql);

                taggedContent.AddRange(dbTags);
            }

            var result = new List<PostsByTagModel>();
            foreach (IGrouping<int, TagDto> groupedTags in taggedContent.GroupBy(x => x.TagId))
            {
                // will be the same tag name for all of these tag Ids
                var tagName = groupedTags.First().Tag;

                IEnumerable<IPublishedContent> publishedContent = helper.Content(groupedTags.Select(t => t.NodeId).Distinct()).WhereNotNull();

                var model = new PostsByTagModel(
                    publishedContent.Select(c => new PostModel(c, publishedValueFallback)).OrderByDescending(c => c.PublishedDate),
                    tagName,
                    masterModel.RootBlogNode.Url().EnsureEndsWith('/') + baseUrlName + "/" + tagName.ToLowerInvariant());

                result.Add(model);
            }

            return result.OrderBy(x => x.TagName).ToArray();
        }

#if DEBUG
        return GetResult();
#else
            //cache this result for a short amount of time
            return (IEnumerable<PostsByTagModel>)AppCaches.RuntimeCache.Get(
                string.Concat(
                typeof(UmbracoHelperExtensions).Name,
                "GetContentByTags",
                masterModel.RootBlogNode.Id,
                tagGroup),
                GetResult,
                TimeSpan.FromSeconds(30));
#endif

    }

    PostsByTagModel IArticulateTagRepository.GetContentByTag(
        UmbracoHelper helper,
        IMasterModel masterModel,
        string tag,
        string tagGroup,
        string baseUrlName,
        long page,
        long pageSize)
    {
        // TODO: We want to use the core for this but it's not available, this needs to be implemented: http://issues.umbraco.org/issue/U4-9290
        PostsByTagModel GetResult()
        {
            Sql sqlTags = GetTagQuery($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node}.id", masterModel);

            // For whatever reason, SQLCE and even SQL SERVER are not willing to lookup
            // tags with hyphens in them, it's super strange, so we force the tag column to be - what it already is!! what tha.
            sqlTags.Where($"CAST({Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}.tag AS NVARCHAR(200)) = @tagName AND {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}." + SqlSyntax.GetQuotedColumnName("group") + " = @tagGroup", new
            {
                tagName = tag,
                tagGroup
            });

            // get the publishedDate property type id on the ArticulatePost content type
            var publishedDatePropertyTypeId = Database.ExecuteScalar<int>(
                $@"SELECT {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.PropertyType}.id FROM {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.ContentType}
INNER JOIN {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.PropertyType} ON {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.PropertyType}.contentTypeId = {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.ContentType}.nodeId
WHERE {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.ContentType}.alias = @contentTypeAlias AND {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.PropertyType}.alias = @propertyTypeAlias",
                new { contentTypeAlias = ArticulateConstants.ContentType.ArticulatePost, propertyTypeAlias = "publishedDate" });

            Sql sqlContent = GetContentByTagQueryForPaging($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node}.id, {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.PropertyData}.dateValue", masterModel, publishedDatePropertyTypeId);

            sqlContent.Append($"WHERE ({Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node}.id IN (").Append(sqlTags).Append("))");

            // order by the dateValue field which will be the publishedDate
            sqlContent.OrderBy($"({Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.PropertyData}.dateValue) DESC");

            // Put on a single line! NPoco paging does weird stuff on multiline
            sqlContent = SqlContext.Sql(sqlContent.SQL.ToSingleLine(), sqlContent.Arguments);

            // TODO: ARGH This still returns multiple non distinct Ids :(
            Page<int> taggedContent = Database.Page<int>(page, pageSize, sqlContent);

            var result = new List<PostsByTagModel>();

            IEnumerable<IPublishedContent> publishedContent = helper.Content(taggedContent.Items).WhereNotNull();

            var model = new PostsByTagModel(
                publishedContent.Select(c => new PostModel(c, publishedValueFallback)),
                tag,
                masterModel.RootBlogNode.Url().EnsureEndsWith('/') + baseUrlName + "/" + tag.ToLowerInvariant(),
                Convert.ToInt32(taggedContent.TotalItems));

            result.Add(model);

            return result.FirstOrDefault();
        }

#if DEBUG
        return GetResult();
#else
            //cache this result for a short amount of time

            return (PostsByTagModel)AppCaches.RuntimeCache.Get(
                string.Concat(
                typeof(UmbracoHelperExtensions).Name,
                "GetContentByTag",
                masterModel.RootBlogNode.Id,
                tagGroup,
                tag,
                page,
                pageSize),
                GetResult,
                TimeSpan.FromSeconds(30));
#endif
    }

    /// <summary>
    /// Gets the tag SQL used to retrieve paged posts for particular tags for a given articulate root node
    /// </summary>
    /// <param name="selectCols"></param>
    /// <param name="masterModel"></param>
    /// <param name="publishedDatePropertyTypeId">
    /// This is needed to perform the sorting on published date,  this is the PK of the property type for publishedDate on the ArticulatePost content type
    /// </param>
    /// <returns></returns>
    /// <remarks>
    /// TODO: We won't need this when this is fixed http://issues.umbraco.org/issue/U4-9290
    /// </remarks>
    private Sql GetContentByTagQueryForPaging(string selectCols, IMasterModel masterModel, int publishedDatePropertyTypeId)
    {
        Sql sql = new Sql()
            .Select(selectCols)
            .From(Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node)
            .InnerJoin(Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Document)
            .On($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Document}.nodeId = {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node}.id")
            .InnerJoin(Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.ContentVersion)
            .On($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.ContentVersion}.nodeId = {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Document}.nodeId")
            .InnerJoin(Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.DocumentVersion)
            .On($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.DocumentVersion}.id = {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.ContentVersion}.id")
            .InnerJoin(Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.PropertyData)
            .On($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.PropertyData}.versionId = {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.DocumentVersion}.id")
            .Where($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node}.nodeObjectType = @nodeObjectType", new { nodeObjectType = Umbraco.Cms.Core.Constants.ObjectTypes.Document })

            // Must be published, this will ensure there's only one version selected
            .Where($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Document}.published = 1")
            .Where($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.DocumentVersion}.published = 1")

            // must only return rows with the publishedDate property data so we only get one row and so we can sort on `cmsPropertyData.dateValue` which will be the publishedDate
            .Where($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.PropertyData}.propertytypeid = @propTypeId", new { propTypeId = publishedDatePropertyTypeId })

            // only get nodes underneath the current articulate root
            .Where($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node}." + SqlSyntax.GetQuotedColumnName("path") + " LIKE @path", new { path = masterModel.RootBlogNode.Path + ",%" });
        return sql;
    }

    /// <summary>
    /// Gets the basic tag SQL used to retrieve tags for a given articulate root node
    /// </summary>
    /// <param name="selectCols"></param>
    /// <param name="masterModel"></param>
    /// <returns></returns>
    /// <remarks>
    /// TODO: We won't need this when this is fixed http://issues.umbraco.org/issue/U4-9290
    /// </remarks>
    private Sql GetTagQuery(string selectCols, IMasterModel masterModel)
    {
        Sql sql = new Sql()
            .Select(selectCols)
            .From(Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag)
            .InnerJoin(Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.TagRelationship)
            .On($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.TagRelationship}.tagId = {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Tag}.id")
            .InnerJoin(Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Content)
            .On($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Content}.nodeId = {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.TagRelationship}.nodeId")
            .InnerJoin(Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node)
            .On($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node}.id = {Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Content}.nodeId")
            .Where($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node}.nodeObjectType = @nodeObjectType", new { nodeObjectType = Umbraco.Cms.Core.Constants.ObjectTypes.Document })

            // only get nodes underneath the current articulate root
            .Where($"{Umbraco.Cms.Core.Constants.DatabaseSchema.Tables.Node}." + SqlSyntax.GetQuotedColumnName("path") + " LIKE @path", new { path = masterModel.RootBlogNode.Path + ",%" });
        return sql;
    }

    private class TagDto
    {
        public int NodeId { get; set; }

        public int TagId { get; set; }

        public string Tag { get; set; }
    }
}
