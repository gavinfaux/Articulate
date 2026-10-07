import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { XMLParser } from 'fast-xml-parser';

const clientId = 'articulate-test-site';
const clientSecret = process.env.ARTICULATE_TEST_SITE_CLIENT_SECRET ?? 'articulate-test-site-secret';
const parser = new XMLParser({ ignoreAttributes: false });
const apiRoot = '/umbraco/management/api/v1';

function required<T>(value: T | null | undefined | '', label: string): T {
  if (value === null || value === undefined || value === '') throw new Error(`${label} is missing`);
  return value;
}

async function token(request: APIRequestContext) {
  const response = await request.post(`${apiRoot}/security/back-office/token`, {
    form: { grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret },
  });
  expect(response.ok(), 'test-site client credentials are accepted').toBeTruthy();
  const body = await response.json() as { access_token: string };
  return body.access_token;
}

async function api(request: APIRequestContext, accessToken: string, path: string, init?: Parameters<APIRequestContext['fetch']>[1]) {
  return request.fetch(`${apiRoot}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
  });
}

async function getDocument(request: APIRequestContext, accessToken: string, id: string) {
  const response = await api(request, accessToken, `/document/${id}`);
  expect(response.ok(), 'Management API returns the document').toBeTruthy();
  return response.json() as Promise<{ documentType: { id: string }; values: Array<{ alias: string; value: unknown; [key: string]: unknown }>; variants: Array<{ culture: string | null; name: string; [key: string]: unknown }>; template?: unknown }>;
}

async function rootDocument(request: APIRequestContext, accessToken: string) {
  const response = await api(request, accessToken, '/tree/document/root?skip=0&take=100');
  expect(response.ok()).toBeTruthy();
  const tree = await response.json() as { items: Array<{ id: string }> };
  for (const item of tree.items) {
    const document = await getDocument(request, accessToken, item.id);
    const type = await api(request, accessToken, `/document-type/${document.documentType.id}`);
    const contentType = await type.json() as { alias: string };
    if (contentType.alias === 'Articulate') return { id: item.id, document };
  }
  throw new Error('No Articulate root document exists; refusing to fall back to another root.');
}

async function publish(request: APIRequestContext, accessToken: string, id: string) {
  const response = await api(request, accessToken, `/document/${id}/publish`, {
    method: 'PUT', data: { publishSchedules: [{ culture: null, schedule: null }] },
  });
  expect(response.ok(), 'Management API publishes normally').toBeTruthy();
}

async function waitFor(request: APIRequestContext, path: string, predicate: (status: number, body: string) => boolean) {
  await expect.poll(async () => {
    const response = await request.get(path, { headers: { 'Cache-Control': 'no-cache' } });
    return predicate(response.status(), await response.text());
  }, { timeout: 20_000, intervals: [250, 500, 1000, 2000] }).toBe(true);
}

function searchResults(html: string): Array<{ title: string; href: string }> {
  const previews = [...html.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi)]
    .filter(([, attributes]) => attributes.match(/\bclass\s*=\s*(["'])(.*?)\1/i)?.[2]?.split(/\s+/).includes('preview'));
  return previews.flatMap(([, , article]) => [...article.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].flatMap(([, attributes, content]) => {
    const href = attributes.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
    const title = content.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim();
    return href && title ? [{ href, title }] : [];
  }));
}

function checkedThemeAssetUrl(href: string, siteUrl: string, expectedPath: string): URL {
  const assetUrl = new URL(href, siteUrl);
  if (assetUrl.origin !== new URL(siteUrl).origin || assetUrl.pathname !== expectedPath) {
    throw new Error('Rendered theme stylesheet must use the dedicated site and exact packaged asset path');
  }
  return assetUrl;
}

test('VAPOR search result extraction ignores identical links outside result articles', () => {
  const twoPreviewsAndSidebar = '<aside><a href="/owned/">Owned result</a></aside><article class="preview"><p>No results</p></article><article class="preview"><a href="/owned/">Owned result</a></article><aside><a href="/owned/">Owned result</a></aside>';
  expect(searchResults(twoPreviewsAndSidebar), 'the owned result in the second preview is found once; sidebar duplicates are excluded').toEqual([
    { href: '/owned/', title: 'Owned result' },
  ]);
});

async function rssItems(request: APIRequestContext, path: string) {
  const response = await request.get(path);
  expect(response.status(), 'RSS endpoint returns HTTP 200').toBe(200);
  const feed = parser.parse(await response.text()) as {
    rss?: { channel?: { item?: Array<{ title?: string; link?: string }> | { title?: string; link?: string } } };
  };
  expect(feed.rss?.channel, 'HTTP 200 response contains an RSS channel').toBeTruthy();
  const items = feed.rss?.channel?.item;
  return Array.isArray(items) ? items : items ? [items] : [];
}

test('draft publishes as rendered content and an RSS item, then unpublishes the route', async ({ request, baseURL }) => {
  const accessToken = await token(request);
  const { id: rootId } = await rootDocument(request, accessToken);
  const childrenResponse = await api(request, accessToken, `/tree/document/children?parentId=${rootId}&skip=0&take=100`);
  expect(childrenResponse.ok()).toBeTruthy();
  const children = (await childrenResponse.json() as { items: Array<{ id: string; documentType: { id: string } }> }).items;
  let articlesId: string | undefined;
  for (const child of children) {
    const response = await api(request, accessToken, `/document-type/${child.documentType.id}`);
    const type = await response.json() as { alias: string };
    if (type.alias === 'ArticulateArchive') articlesId = child.id;
  }
  expect(articlesId, 'the Articulate root has its Articles archive').toBeTruthy();

  const marker = `e2e-${randomUUID()}`;
  const title = `E2E ${marker}`;
  const body = `Distinctive publishing body ${marker}`;
  const slug = marker.toLowerCase();
  const siteUrl = required(baseURL, 'configured isolated base URL');
  const archiveUrlsResponse = await api(request, accessToken, `/document/urls?id=${articlesId}`);
  expect(archiveUrlsResponse.ok()).toBeTruthy();
  const archiveUrls = await archiveUrlsResponse.json() as Array<{ urlInfos: Array<{ url: string }> }>;
  const archiveUrl = required(archiveUrls[0]?.urlInfos[0]?.url, 'published Articles archive URL');
  const archivePath = new URL(archiveUrl, siteUrl).pathname;
  const publicPath = `${archivePath.replace(/\/$/, '')}/${slug}/`;
  const rssPath = '/rss';
  let documentId: string | undefined;

  try {
    const createResponse = await api(request, accessToken, '/document', {
      method: 'POST',
      data: {
        parent: { id: articlesId },
        documentType: { id: '9c2df3ea-74d9-41ef-8773-07960ac5a819' },
        template: null,
        variants: [{ culture: null, segment: null, name: title }],
        values: [{ alias: 'markdown', value: body, culture: null, segment: null, editorAlias: 'Umbraco.MarkdownEditor', entityType: 'document-property-value' }, { alias: 'umbracoUrlName', value: slug, culture: null, segment: null, editorAlias: 'Umbraco.TextBox', entityType: 'document-property-value' }],
      },
    });
    expect(createResponse.status(), 'Management API creates the draft').toBe(201);
    const location = required(createResponse.headers().location, 'create response location');
    documentId = required(new URL(location, siteUrl).pathname.split('/').at(-1), 'created document id');

    const before = await request.get(publicPath);
    expect(before.status(), 'draft post is not publicly available').toBe(404);
    await publish(request, accessToken, documentId);
    const urlsResponse = await api(request, accessToken, `/document/urls?id=${documentId}`);
    expect(urlsResponse.ok()).toBeTruthy();
    const urls = await urlsResponse.json() as Array<{ urlInfos: Array<{ url: string }> }>;
    const publishedUrl = required(urls[0]?.urlInfos[0]?.url, 'published document URL');
    const expectedAbsoluteUrl = new URL(publishedUrl, siteUrl).href;
    expect(new URL(expectedAbsoluteUrl).pathname).toBe(publicPath);
    await waitFor(request, publicPath, (status, html) => status === 200 && html.includes(body));
    await expect.poll(async () => {
      return (await rssItems(request, rssPath)).some(item => item.title === title && item.link === expectedAbsoluteUrl);
    }, { timeout: 20_000 }).toBe(true);

    const unpublish = await api(request, accessToken, `/document/${documentId}/unpublish`, { method: 'PUT', data: { cultures: null } });
    expect(unpublish.ok(), 'Management API unpublishes normally').toBeTruthy();
    await waitFor(request, publicPath, status => status === 404);
  } finally {
    if (documentId) {
      const deletion = await api(request, accessToken, `/document/${documentId}`, { method: 'DELETE' });
      expect([200, 204].includes(deletion.status()), 'test content is cleaned up').toBeTruthy();
    }
  }
});

test('RSS maxItems binds to query values and clamps values below one', async ({ request, baseURL }) => {
  const accessToken = await token(request);
  const { id: rootId } = await rootDocument(request, accessToken);
  const childrenResponse = await api(request, accessToken, `/tree/document/children?parentId=${rootId}&skip=0&take=100`);
  expect(childrenResponse.ok()).toBeTruthy();
  const children = (await childrenResponse.json() as { items: Array<{ id: string; documentType: { id: string } }> }).items;
  let archiveId: string | undefined;
  for (const child of children) {
    const response = await api(request, accessToken, `/document-type/${child.documentType.id}`);
    const type = await response.json() as { alias: string };
    if (type.alias === 'ArticulateArchive') archiveId = child.id;
  }
  const articlesId = required(archiveId, 'Articles archive');
  const siteUrl = required(baseURL, 'configured isolated base URL');
  const fixtures = [
    { title: `E2E RSS older ${randomUUID()}`, slug: `rss-${randomUUID()}` },
    { title: `E2E RSS newer ${randomUUID()}`, slug: `rss-${randomUUID()}` },
  ];
  const documentIds: string[] = [];
  const expectedLinks: string[] = [];
  try {
    for (const fixture of fixtures) {
      const created = await api(request, accessToken, '/document', {
        method: 'POST',
        data: {
          parent: { id: articlesId },
          documentType: { id: '9c2df3ea-74d9-41ef-8773-07960ac5a819' },
          template: null,
          variants: [{ culture: null, segment: null, name: fixture.title }],
          values: [
            { alias: 'markdown', value: `RSS fixture ${fixture.slug}`, culture: null, segment: null, editorAlias: 'Umbraco.MarkdownEditor', entityType: 'document-property-value' },
            { alias: 'umbracoUrlName', value: fixture.slug, culture: null, segment: null, editorAlias: 'Umbraco.TextBox', entityType: 'document-property-value' },
          ],
        },
      });
      expect(created.status(), 'Management API creates each RSS draft').toBe(201);
      const location = required(created.headers().location, 'create response location');
      const id = required(new URL(location, siteUrl).pathname.split('/').at(-1), 'created document id');
      documentIds.push(id);
      await publish(request, accessToken, id);
      const urls = await api(request, accessToken, `/document/urls?id=${id}`);
      expect(urls.ok()).toBeTruthy();
      const urlData = await urls.json() as Array<{ urlInfos: Array<{ url: string }> }>;
      expectedLinks.push(new URL(required(urlData[0]?.urlInfos[0]?.url, 'published document URL'), siteUrl).href);
    }

    const readFeed = async (maxItems: number) => rssItems(request, `/rss?maxItems=${maxItems}`);
    await expect.poll(async () => {
      const feed = await readFeed(2);
      return fixtures.every((fixture, index) => feed.some(item => item.title === fixture.title && item.link === expectedLinks[index]));
    }, { timeout: 20_000, intervals: [250, 500, 1000, 2000] }).toBe(true);

    const twoItems = await readFeed(2);
    expect(twoItems).toHaveLength(2);
    expect(twoItems.map(item => ({ title: item.title, link: item.link }))).toEqual(expect.arrayContaining(
      fixtures.map((fixture, index) => ({ title: fixture.title, link: expectedLinks[index] })),
    ));
    const clampedToOne = await readFeed(0);
    expect(clampedToOne).toHaveLength(1);
    expect(fixtures.some((fixture, index) =>
      clampedToOne[0]?.title === fixture.title && clampedToOne[0]?.link === expectedLinks[index]),
    'maxItems=0 is clamped to one owned feed item').toBe(true);
  } finally {
    for (const id of documentIds) {
      const deletion = await api(request, accessToken, `/document/${id}`, { method: 'DELETE' });
      expect([200, 204].includes(deletion.status()), 'RSS fixture is cleaned up').toBeTruthy();
    }
  }
});

test('public search discovers a published Markdown post and excludes drafts and non-matching queries', async ({ request, baseURL }) => {
  const accessToken = await token(request);
  const { id: rootId, document: root } = await rootDocument(request, accessToken);
  expect(root.values.find(value => value.alias === 'theme')?.value, 'VAPOR List.cshtml owns the dedicated fixture search-result article markup').toBe('VAPOR');
  const searchValue = root.values.find(value => value.alias === 'searchUrlName')?.value;
  if (typeof searchValue !== 'string' || !searchValue) throw new Error('searchUrlName is missing or not a string');

  const childrenResponse = await api(request, accessToken, `/tree/document/children?parentId=${rootId}&skip=0&take=100`);
  expect(childrenResponse.ok(), 'Management API lists root children').toBeTruthy();
  const children = (await childrenResponse.json() as { items: Array<{ id: string; documentType: { id: string } }> }).items;
  let articlesId: string | undefined;
  for (const child of children) {
    const response = await api(request, accessToken, `/document-type/${child.documentType.id}`);
    const type = await response.json() as { alias: string };
    if (type.alias === 'ArticulateArchive') articlesId = child.id;
  }
  const archiveId = required(articlesId, 'Articles archive');
  const marker = `e2e${randomUUID().replaceAll('-', '')}`;
  const titleToken = `title${randomUUID().replaceAll('-', '')}`;
  const title = `E2E Search ${titleToken}`;
  const body = `SearchableMarkdown ${marker} searchable fixture`;
  const slug = `search-${randomUUID()}`;
  const siteUrl = required(baseURL, 'configured isolated base URL');
  const archiveUrlsResponse = await api(request, accessToken, `/document/urls?id=${archiveId}`);
  expect(archiveUrlsResponse.ok()).toBeTruthy();
  const archiveUrls = await archiveUrlsResponse.json() as Array<{ urlInfos: Array<{ url: string }> }>;
  const archiveUrl = required(archiveUrls[0]?.urlInfos[0]?.url, 'published Articles archive URL');
  const archivePath = new URL(archiveUrl, siteUrl).pathname;
  const publicPath = `${archivePath.replace(/\/$/, '')}/${slug}/`;
  const resultPath = `/${searchValue}/?term=${encodeURIComponent(marker)}`;
  const titleOnlyPath = `/${searchValue}/?term=${encodeURIComponent(titleToken)}`;
  const multiTermPath = `/${searchValue}/?term=${encodeURIComponent(`${titleToken} ${marker}`)}`;
  const nonmatchingPath = `/${searchValue}/?term=${encodeURIComponent(`absent${randomUUID().replaceAll('-', '')}`)}`;
  let documentId: string | undefined;

  try {
    const createResponse = await api(request, accessToken, '/document', {
      method: 'POST',
      data: {
        parent: { id: archiveId },
        documentType: { id: '9c2df3ea-74d9-41ef-8773-07960ac5a819' },
        template: null,
        variants: [{ culture: null, segment: null, name: title }],
        values: [
          { alias: 'markdown', value: body, culture: null, segment: null, editorAlias: 'Umbraco.MarkdownEditor', entityType: 'document-property-value' },
          { alias: 'umbracoUrlName', value: slug, culture: null, segment: null, editorAlias: 'Umbraco.TextBox', entityType: 'document-property-value' },
        ],
      },
    });
    expect(createResponse.status(), 'Management API creates the draft').toBe(201);
    const location = required(createResponse.headers().location, 'create response location');
    documentId = required(new URL(location, siteUrl).pathname.split('/').at(-1), 'created document id');

    for (const queryPath of [resultPath, titleOnlyPath, multiTermPath, nonmatchingPath]) {
      const response = await request.get(queryPath);
      expect(response.status(), 'public search returns HTTP 200').toBe(200);
      expect(searchResults(await response.text()).some(result => new URL(result.href, siteUrl).href === new URL(publicPath, siteUrl).href), 'draft URL is absent from rendered search links').toBe(false);
    }

    await publish(request, accessToken, documentId);
    const urlsResponse = await api(request, accessToken, `/document/urls?id=${documentId}`);
    expect(urlsResponse.ok()).toBeTruthy();
    const urls = await urlsResponse.json() as Array<{ urlInfos: Array<{ url: string }> }>;
    const publishedUrl = required(urls[0]?.urlInfos[0]?.url, 'published document URL');
    const expectedUrl = new URL(publishedUrl, siteUrl).href;
    expect(new URL(expectedUrl).pathname).toBe(publicPath);
    const includesOwnedResult = async (path: string) => {
      const response = await request.get(path);
      expect(response.status(), 'public search returns HTTP 200 while indexing propagates').toBe(200);
      return searchResults(await response.text()).some(result =>
        result.title === title && new URL(result.href, siteUrl).href === expectedUrl);
    };
    for (const queryPath of [resultPath, titleOnlyPath, multiTermPath]) {
      await expect.poll(() => includesOwnedResult(queryPath), {
        timeout: 20_000, intervals: [250, 500, 1000, 2000],
      }).toBe(true);
    }

    expect(await includesOwnedResult(nonmatchingPath), 'non-matching search excludes the fixture URL from rendered links').toBe(false);
  } finally {
    if (documentId) {
      const deletion = await api(request, accessToken, `/document/${documentId}`, { method: 'DELETE' });
      expect([200, 204].includes(deletion.status()), 'search fixture is cleaned up').toBeTruthy();
    }
  }
});

test('root theme changes serve the alternate packaged stylesheet and restore the original configuration', async ({ request, baseURL }) => {
  const accessToken = await token(request);
  const { id, document } = await rootDocument(request, accessToken);
  const themeValue = document.values.find(value => value.alias === 'theme');
  const originalTheme = themeValue?.value;
  if (typeof originalTheme !== 'string' || !originalTheme) throw new Error('The Articulate root theme is missing or not a string');
  const alternateTheme = originalTheme.toLowerCase() === 'vapor' ? 'Material' : 'VAPOR';
  const siteUrl = required(baseURL, 'configured isolated base URL');
  const previousValues = document.values;
  const previousVariants = document.variants;
  const previousTemplate = document.template ?? null;
  await test.info().attach('theme-before-mutation.json', {
    body: JSON.stringify({ id, theme: originalTheme, template: previousTemplate }),
    contentType: 'application/json',
  });

  const updateTheme = async (theme: string) => {
    const values = previousValues.map(value => value.alias === 'theme' ? { ...value, value: theme } : value);
    const update = await api(request, accessToken, `/document/${id}`, {
      method: 'PUT', data: { values, variants: previousVariants, template: previousTemplate },
    });
    expect(update.ok(), `Management API saves the root theme ${theme}`).toBeTruthy();
    await publish(request, accessToken, id);
  };
  const verifyTheme = async (theme: string) => {
    let href = '';
    await expect.poll(async () => {
      const page = await request.get('/');
      if (page.status() !== 200) return false;
      const html = await page.text();
      const link = [...html.matchAll(/<link\b([^>]*?)>/gi)].map(([, attributes]) => attributes.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2]).find(value =>
        value?.toLowerCase().includes(`/app_plugins/articulate/themes/${theme.toLowerCase()}/assets/dist/css/${theme.toLowerCase()}.min.css`));
      if (!link) return false;
      href = link;
      return true;
    }, { timeout: 20_000, intervals: [250, 500, 1000, 2000] }).toBe(true);
    const assetPaths = {
      VAPOR: '/App_Plugins/Articulate/Themes/VAPOR/assets/dist/css/vapor.min.css',
      Material: '/App_Plugins/Articulate/Themes/Material/assets/dist/css/material.min.css',
    } as const;
    const assetPath = theme === 'VAPOR' ? assetPaths.VAPOR : theme === 'Material' ? assetPaths.Material : undefined;
    expect(assetPath, 'theme is one of the two packaged smoke themes').toBeTruthy();
    const assetUrl = checkedThemeAssetUrl(href, siteUrl, required(assetPath, 'allowlisted packaged theme stylesheet path'));
    expect(assetUrl.origin, 'theme stylesheet stays on the dedicated site').toBe(new URL(siteUrl).origin);
    const asset = await request.get(assetUrl.href);
    expect(asset.status(), `${theme} stylesheet is served`).toBe(200);
    expect(asset.headers()['content-type'], `${theme} asset has CSS MIME type`).toMatch(/^text\/css(?:;|$)/i);
    expect((await asset.text()).trim(), `${theme} packaged stylesheet has a body`).not.toBe('');
  };

  let mutationAttempted = false;
  try {
    await verifyTheme(originalTheme);
    mutationAttempted = true;
    await updateTheme(alternateTheme);
    await verifyTheme(alternateTheme);
  } finally {
    if (mutationAttempted) {
      await updateTheme(originalTheme);
      await verifyTheme(originalTheme);
    }
  }
});

test('public search redirects page one canonically and reserved indexes cannot bypass published-content search', async ({ request, baseURL }) => {
  const accessToken = await token(request);
  const { id: rootId, document: root } = await rootDocument(request, accessToken);
  expect(root.values.find(value => value.alias === 'theme')?.value, 'VAPOR List.cshtml owns the dedicated fixture search-result article markup').toBe('VAPOR');
  const searchValue = root.values.find(value => value.alias === 'searchUrlName')?.value;
  if (typeof searchValue !== 'string' || !searchValue) throw new Error('searchUrlName is missing or not a string');
  const children = await api(request, accessToken, `/tree/document/children?parentId=${rootId}&skip=0&take=100`);
  expect(children.ok()).toBeTruthy();
  const childItems = (await children.json() as { items: Array<{ id: string; documentType: { id: string } }> }).items;
  let archiveId: string | undefined;
  for (const child of childItems) {
    const type = await api(request, accessToken, `/document-type/${child.documentType.id}`);
    if ((await type.json() as { alias: string }).alias === 'ArticulateArchive') archiveId = child.id;
  }
  const archive = required(archiveId, 'Articles archive');
  const marker = `reserved${randomUUID().replaceAll('-', '')}`;
  const title = `E2E reserved search ${marker}`;
  const slug = `reserved-${randomUUID()}`;
  const siteUrl = required(baseURL, 'configured isolated base URL');
  const term = `routing-${randomUUID()}`;
  const redirectPath = `/${searchValue}/?term=${encodeURIComponent(term)}&indexName=ExternalIndex&p=1`;
  const rootUrls = await api(request, accessToken, `/document/urls?id=${rootId}`);
  expect(rootUrls.ok()).toBeTruthy();
  const rootUrlData = await rootUrls.json() as Array<{ urlInfos: Array<{ url: string }> }>;
  const rootPath = new URL(required(rootUrlData[0]?.urlInfos[0]?.url, 'published root URL'), required(baseURL, 'configured isolated base URL')).pathname;
  const queryPath = `/${searchValue}/?term=${encodeURIComponent(marker)}`;
  let documentId: string | undefined;
  let expectedUrl: string | undefined;
  try {
    const redirect = await request.fetch(redirectPath, { maxRedirects: 0 });
    expect(redirect.status(), 'p=1 uses the controller canonical redirect').toBe(302);
    expect(redirect.headers().location, 'redirect preserves the term and public external index selector at the published root URL').toBe(`${rootPath}?term=${encodeURIComponent(term)}&indexName=ExternalIndex`);

    const created = await api(request, accessToken, '/document', {
      method: 'POST',
      data: {
        parent: { id: archive },
        documentType: { id: '9c2df3ea-74d9-41ef-8773-07960ac5a819' },
        template: null,
        variants: [{ culture: null, segment: null, name: title }],
        values: [
          { alias: 'markdown', value: `Reserved index fixture ${marker}`, culture: null, segment: null, editorAlias: 'Umbraco.MarkdownEditor', entityType: 'document-property-value' },
          { alias: 'umbracoUrlName', value: slug, culture: null, segment: null, editorAlias: 'Umbraco.TextBox', entityType: 'document-property-value' },
        ],
      },
    });
    expect(created.status()).toBe(201);
    documentId = required(new URL(required(created.headers().location, 'created document location'), siteUrl).pathname.split('/').at(-1), 'created document id');
    const archiveUrls = await api(request, accessToken, `/document/urls?id=${archive}`);
    expect(archiveUrls.ok()).toBeTruthy();
    const archiveUrlData = await archiveUrls.json() as Array<{ urlInfos: Array<{ url: string }> }>;
    const archivePath = new URL(required(archiveUrlData[0]?.urlInfos[0]?.url, 'published Articles archive URL'), siteUrl).pathname;
    expectedUrl = new URL(`${archivePath.replace(/\/$/, '')}/${slug}/`, siteUrl).href;

    for (const indexName of ['InternalIndex', 'MembersIndex']) {
      const response = await request.get(`${queryPath}&indexName=${indexName}`);
      expect(response.status()).toBe(200);
      expect(searchResults(await response.text()).some(result => new URL(result.href, siteUrl).href === expectedUrl), `${indexName} cannot expose a draft`).toBe(false);
    }

    await publish(request, accessToken, documentId);
    for (const indexName of ['InternalIndex', 'MembersIndex']) {
      const reservedPath = `${queryPath}&indexName=${indexName}`;
      await expect.poll(async () => {
        const response = await request.get(reservedPath);
        if (response.status() !== 200) return false;
        const rendered = await response.text();
        const results = searchResults(rendered);
        return results.some(result => result.title === title && new URL(result.href, siteUrl).href === expectedUrl);
      }, { timeout: 20_000, intervals: [250, 500, 1000, 2000] }).toBe(true);
    }
  } finally {
    if (documentId) {
      const deletion = await api(request, accessToken, `/document/${documentId}`, { method: 'DELETE' });
      expect([200, 204].includes(deletion.status()), 'reserved-index fixture is cleaned up').toBeTruthy();
    }
  }
});

test('publishing a real search route configuration refreshes a warmed route without reload', async ({ request }) => {
  const accessToken = await token(request);
  const { id, document } = await rootDocument(request, accessToken);
  const original = document.values.find(value => value.alias === 'searchUrlName');
  expect(original?.value, 'searchUrlName is configured on the real Articulate root').toBeTruthy();
  if (!original || typeof original.value !== 'string' || !original.value) throw new Error('searchUrlName is missing or not a string');
  const oldSegment = original.value;
  const newSegment = `search-${randomUUID().slice(0, 8)}`;
  const oldPath = `/${oldSegment}/`;
  const newPath = `/${newSegment}/`;
  const searchTerm = `route-${randomUUID()}`;
  const expectedSearchOutput = 'No blog posts found';
  const oldUrl = `${oldPath}?term=${encodeURIComponent(searchTerm)}`;
  const newUrl = `${newPath}?term=${encodeURIComponent(searchTerm)}`;
  const warmed = await request.get(oldUrl);
  expect(warmed.status(), 'the original dynamic search route is warm and responds').toBe(200);
  expect(await warmed.text(), 'the warmed route renders the expected search result page').toContain(expectedSearchOutput);
  const previousValues = document.values;
  const previousVariants = document.variants;
  const previousTemplate = document.template ?? null;
  await test.info().attach('search-route-before-mutation.json', {
    body: JSON.stringify({ id, searchUrlName: oldSegment, template: previousTemplate }),
    contentType: 'application/json',
  });
  try {
    const values = previousValues.map(value => value.alias === 'searchUrlName' ? { ...value, value: newSegment } : value);
    const update = await api(request, accessToken, `/document/${id}`, {
      method: 'PUT', data: { values, variants: previousVariants, template: previousTemplate },
    });
    expect(update.ok(), 'Management API saves the real route property').toBeTruthy();
    await publish(request, accessToken, id);
    await waitFor(request, newUrl, (status, html) => status === 200 && html.includes(expectedSearchOutput));
    await waitFor(request, oldUrl, status => status === 404);
  } finally {
    const restore = await api(request, accessToken, `/document/${id}`, {
      method: 'PUT', data: { values: previousValues, variants: previousVariants, template: previousTemplate },
    });
    expect(restore.ok(), 'fixture route property is restored').toBeTruthy();
    await publish(request, accessToken, id);
    await waitFor(request, oldUrl, (status, html) => status === 200 && html.includes(expectedSearchOutput));
    await waitFor(request, newUrl, status => status === 404);
  }
});
