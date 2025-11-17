# AI/LLM-Friendly Content Negotiation

Articulate can serve machine-friendly representations of posts and lists when a client sends an `Accept` header asking for text formats. This makes your blog content easier for AI agents, crawlers, and automations to consume without scraping HTML.

## What It Serves

- `Accept: text/markdown` -> Original post markdown when available; concise page header + markdown body
- `Accept: text/plain` -> Plain-text version of the post/list (HTML stripped, decoded)
- Otherwise -> Normal HTML views

Lists (archive, author, tags, categories, search) also support these formats and render concise index entries per post.

## How Negotiation Works

- Controllers parse `Accept` (with quality factors) and pick the best available representation.
- For posts using the Markdown editor, the stored markdown is returned for `text/markdown`. If no markdown exists, the controller falls back to `text/plain`.
- For plain text, the rendered HTML body is stripped of tags and HTML-decoded.

## Origin HTTP Headers

All responses from post and list endpoints include:

- `X-Content-Variant: md|txt|html`
- `Vary: X-Content-Variant`
- `Cache-Control: public, max-age=0, s-maxage=120` for posts (single)
- `Cache-Control: public, max-age=0, s-maxage=60` for lists (archive/tags/categories/search)

Rationale:

- `X-Content-Variant` is a normalized variant header the edge/CDN can key on, avoiding cache fragmentation on raw `Accept`.
- `Vary: X-Content-Variant` ensures downstream caches keep separate entries for html/md/txt.
- `s-maxage` guides shared caches (e.g., CDNs) while keeping browsers short-lived.

## Server Output Caching

Articulate registers output-cache policies that vary by `X-Content-Variant` (and also `Accept` as a fallback):

- `Articulate120` -> used by post controllers (single posts)
- `Articulate60` -> used by list/search/author controllers
- `Articulate300` -> used by RSS

These policies ensure distinct cache entries are produced per variant.

## CDN Configuration (Strategy B: Normalize -> Key on Variant)

Recommended approach: at the edge, derive a compact variant from `Accept` and include that header in the cache key.

1. Normalize the request at the edge

- Compute `X-Content-Variant` on the request:
  - If `Accept` contains `markdown`, `x-markdown`, or `+markdown` -> `md`
  - Else if `Accept` contains `text/plain` -> `txt`
  - Else -> `html`

1. Include the header in the CDN cache key

- Add `X-Content-Variant` to the cache key so md/txt/html variants cache separately.
- Forward `Accept` to origin (optional but recommended). The origin already sets the same header and varies by it.

Provider notes:

- Cloudflare
  - Transform Rule: set request header `X-Content-Variant` using the above logic.
  - Cache Rules: include request header `X-Content-Variant` in the cache key; respect origin caching or set Edge TTLs.

### Cloudflare (UI) - step-by-step

Use two Transform Rules (markdown/plain) plus one fallback (html), then a Cache Rule to include the header.

1. Transform Rules -> HTTP Request Header Modification

- Rule A: markdown
  - When incoming requests match... Expression
    - `(http.request.uri.path starts_with "/blog") and (lower(http.request.headers["accept"][0]) contains "markdown")`
  - Then... Set static request header
    - Name: `X-Content-Variant`
    - Value: `md`

- Rule B: plain text
  - Expression
    - `(http.request.uri.path starts_with "/blog") and (lower(http.request.headers["accept"][0]) contains "text/plain")`
  - Set header
    - Name: `X-Content-Variant`
    - Value: `txt`

- Rule C: fallback (html)
  - Expression
    - `http.request.uri.path starts_with "/blog"`
  - Set header
    - Name: `X-Content-Variant`
    - Value: `html`

Notes

- Adjust the path prefix (`/blog`) to your Articulate mount path or use a broader condition (e.g., your hostname).
- Put the rules in the order above so markdown/plain match before the fallback.
- The `lower(... ) contains "markdown"` check also matches `x-markdown` and `+markdown` types.

1. Cache Rules -> Create rule

- When incoming requests match... Expression
  - `http.request.uri.path starts_with "/blog"`
- Settings
  - Cache Key -> Custom
    - Include: Header `X-Content-Variant`
  - Edge TTL
    - Either "Respect existing headers" (origin `s-maxage`) or set a fixed TTL
  - Origin Cache Control -> On

Optional

- Response Header Modification: you can add/inspect `Vary: X-Content-Variant` at the edge. The origin already sends it.

#### Cloudflare examples: Subpath mount (e.g., /blog)

Use these expressions verbatim, changing the host and path as needed:

- Markdown (Transform Rule)

```text
(http.request.method in {"GET" "HEAD"})
and http.host eq "example.com"
and (lower(http.request.headers["accept"][0]) contains "markdown")
and http.request.uri.path starts_with "/blog"
and not http.request.uri.path matches "(?i)\\.(?:css|js|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json|xml)$"
```

- Plain text (Transform Rule)

```text
(http.request.method in {"GET" "HEAD"})
and http.host eq "example.com"
and (lower(http.request.headers["accept"][0]) contains "text/plain")
and http.request.uri.path starts_with "/blog"
and not http.request.uri.path matches "(?i)\\.(?:css|js|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json|xml)$"
```

- Fallback html (Transform Rule)

```text
(http.request.method in {"GET" "HEAD"})
and http.host eq "example.com"
and http.request.uri.path starts_with "/blog"
and not http.request.uri.path matches "(?i)\\.(?:css|js|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json|xml)$"
```

- Cache Rule (include header X-Content-Variant in cache key)

```text
http.request.method in {"GET" "HEAD"}
and http.host eq "example.com"
and http.request.uri.path starts_with "/blog"
and not http.request.uri.path matches "(?i)\\.(?:css|js|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json|xml)$"
```

#### Cloudflare examples: Root mount (/)

If your blog is at the site root, exclude `/umbraco` and static file extensions instead of a path prefix:

- Markdown (Transform Rule)

```text
(http.request.method in {"GET" "HEAD"})
and http.host eq "example.com"
and (lower(http.request.headers["accept"][0]) contains "markdown")
and not http.request.uri.path starts_with "/umbraco"
and not http.request.uri.path matches "(?i)\\.(?:css|js|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json|xml)$"
```

- Plain text (Transform Rule)

```text
(http.request.method in {"GET" "HEAD"})
and http.host eq "example.com"
and (lower(http.request.headers["accept"][0]) contains "text/plain")
and not http.request.uri.path starts_with "/umbraco"
and not http.request.uri.path matches "(?i)\\.(?:css|js|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json|xml)$"
```

- Fallback html (Transform Rule)

```text
(http.request.method in {"GET" "HEAD"})
and http.host eq "example.com"
and not http.request.uri.path starts_with "/umbraco"
and not http.request.uri.path matches "(?i)\\.(?:css|js|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json|xml)$"
```

- Cache Rule (include header X-Content-Variant in cache key)

```text
http.request.method in {"GET" "HEAD"}
and http.host eq "example.com"
and not http.request.uri.path starts_with "/umbraco"
and not http.request.uri.path matches "(?i)\\.(?:css|js|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot|map|json|xml)$"
```

- AWS CloudFront
  - Lambda@Edge/CloudFront Functions (viewer-request): set `x-content-variant` as above.
  - Cache Policy: include header `x-content-variant` in the cache key; honor origin cache headers.

- Fastly
  - VCL snippet:
    - `set req.http.X-Content-Variant = if (req.http.Accept ~ "(?i)markdown") "md" else if (req.http.Accept ~ "text/plain") "txt" else "html";`
    - `set req.hash += req.http.X-Content-Variant;`
  - Keep `beresp.http.Vary = "X-Content-Variant";` from origin; optionally add `Surrogate-Control: max-age=60/120`.

If you prefer a config-only fallback (no edge logic), you can include raw `Accept` in the cache key; however, it may result in more variants due to q-values and header permutations. Strategy B avoids that.

## HTML Discoverability

To help non-negotiating clients discover text formats, post pages include alternate links in the `<head>`:

```html
<link rel="alternate" type="text/markdown" href="/blog/my-post" />
<link rel="alternate" type="text/plain" href="/blog/my-post" />
```

## Examples

- Markdown post:
  - `curl -H "Accept: text/markdown" https://example.com/blog/my-post`

- Plain text post:
  - `curl -H "Accept: text/plain" https://example.com/blog/my-post`

- Markdown list (archive page):
  - `curl -H "Accept: text/markdown" "https://example.com/blog/archive?p=1"`

- Inspect headers:
  - `curl -I -H "Accept: text/markdown" https://example.com/blog/my-post`
  - Expect `X-Content-Variant: md`, `Vary: X-Content-Variant`, `Cache-Control: public, max-age=0, s-maxage=120`.

## Notes

- Posts without a markdown body will return plain text when `text/markdown` is requested.
- TTLs (`s-maxage`) are aligned to output-cache policies and can be tuned if your site updates more or less frequently.
