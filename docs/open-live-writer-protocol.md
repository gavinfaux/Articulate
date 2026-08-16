# Open Live Writer MetaWeblog compatibility

Articulate exposes the MetaWeblog XML-RPC route through the dynamic route for the configured Articulate root. The compatibility floor is Open Live Writer 0.6.2.0 (Windows); Open Live Writer 0.7.0 is also supported. The MetaWeblog client implementation is protocol-compatible across those releases, so Articulate does not branch on client version. The macOS client is an additional smoke target when available.

## Request matrix

| Operation            | XML-RPC method                   | Articulate provider   | Expected result                                                              |
|----------------------|----------------------------------|-----------------------|------------------------------------------------------------------------------|
| Login/discovery      | `blogger.getUsersBlogs`          | `GetUsersBlogsAsync`  | Returns only the configured, browsable blog root.                            |
| Categories           | `metaWeblog.getCategories`       | `GetCategoriesAsync`  | Returns Articulate categories for an authorized root.                        |
| Tags                 | `wp.getTags`                     | `GetTagsAsync`        | Returns Articulate tags for an authorized root.                              |
| Read recent          | `metaWeblog.getRecentPosts`      | `GetRecentPostsAsync` | Returns only authorized Articulate posts.                                    |
| Read one             | `metaWeblog.getPost`             | `GetPostAsync`        | Requires browse permission and configured-blog ancestry.                     |
| Draft                | `metaWeblog.newPost(..., false)` | `AddPostAsync`        | Saves an authorized unpublished post.                                        |
| Publish              | `metaWeblog.newPost(..., true)`  | `AddPostAsync`        | Requires create and publish permission.                                      |
| Edit draft/published | `metaWeblog.editPost`            | `EditPostAsync`       | Requires update; publish also requires publish permission.                   |
| Delete               | `blogger.deletePost`             | `DeletePostAsync`     | Requires delete permission; moves to recycle bin.                            |
| Image upload         | `metaWeblog.newMediaObject`      | `NewMediaObjectAsync` | Requires `ActionUpdate` on the configured blog root before filesystem write. |

`wp.newCategory`, page methods, author discovery, and user-info discovery are not advertised or implemented. Custom `dateCreated` is preserved for drafts and published posts.

## Manual smoke procedure

1. Configure a test Articulate root and its MetaWeblog route.
2. Use an authorized test account in Open Live Writer 0.6.2.0 and 0.7.0.
3. Run discovery, read recent posts, open a post, save a draft, publish, edit, delete, and upload an image.
4. Repeat reads and writes with a low-privilege account and confirm authorization failures do not mutate content or storage.
5. If testing the macOS client, repeat the same core XML-RPC operations; no client-specific server behavior is expected.

Do not place real credentials or production URLs in this document or captured test artifacts.
