#!/usr/bin/env node
//
// smoke.mjs — Articulate harness smoke-test / publish / confirm / theme
//
// Modes:
//   publish   Full publish root + descendants via Management API (default; --no-descendants skips children)
//   confirm   Read-only: verify root + children are published and / returns 200
//   smoke     Wait for production root to return 200 (docker compose must already be running)
//   theme     Read current theme, change to a different theme, publish, verify theme CSS in HTML
//   blogml    Import the deterministic BlogML fixture and verify the operation succeeds
//   fixture   Create the scoped author fixture after the app has restarted
//   export    Export the current blog as BlogML and verify imported posts
//   markdown  Create a Markdown post through the standalone editor as the fixture author
//   ol        Exercise the Open Live Writer / MetaWeblog endpoint as the scoped author
//
// Env:
//   UMBRACO_PUBLIC_URL          default: https://localhost:18443
//   ARTICULATE_HARNESS_API_CLIENT_SECRET   default: articulate-dev-local-secret (matches docker-compose)
//
// Examples:
//   node docker/smoke.mjs publish
//   node docker/smoke.mjs confirm
//   node docker/smoke.mjs smoke
//   node docker/smoke.mjs theme
//   node docker/smoke.mjs blogml
//   node docker/smoke.mjs fixture
//   node docker/smoke.mjs markdown
//   node docker/smoke.mjs ol

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import https from "node:https";
import http from "node:http";

// --- helpers ----------------------------------------------------------------

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

function now() {
  return Math.floor(Date.now() / 1000);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- HTTP transport ---------------------------------------------------------

// The dev harness always serves Caddy's self-signed `tls internal` cert, which
// Node does not trust. Loopback and private-network hosts (incl. the LAN IP the
// operator may browse via UMBRACO_PUBLIC_URL) are all dev-harness targets, so
// disable cert validation for them. Public hosts keep strict validation.
function isDevHost(host) {
  if (["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) return true;
  // Private IPv4 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
  );
}

function request(url, opts = {}) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(url);
    } catch (error) {
      reject(error);
      return;
    }
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + u.search,
        method: opts.method || "GET",
        headers: opts.headers || {},
        rejectUnauthorized: isDevHost(u.hostname) ? false : true,
        timeout: opts.timeout || 30_000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf-8");
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("request timeout"));
    });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function jsonGet(url, token) {
  const res = await request(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  return parseJsonResponse(res, url);
}

async function jsonPut(url, token, body) {
  const res = await request(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseJsonResponse(res, url);
}

async function jsonDelete(url, token) {
  const res = await request(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (res.status < 200 || res.status >= 300) {
    die(`DELETE ${url} returned HTTP ${res.status}: ${res.body.slice(0, 300)}`);
  }
}

async function post(url, body) {
  const res = await request(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  return parseJsonResponse(res, url);
}

async function uploadBlogMl(base, token, rootId) {
  const xmlPath = new URL("./fixtures/blogml-fixture.xml", import.meta.url);
  const xml = await fs.readFile(xmlPath, "utf8");
  const boundary = `----articulate-smoke-${Date.now()}`;
  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="importFile"; filename="blogml-fixture.xml"\r\nContent-Type: application/xml\r\n\r\n`,
  );
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body = Buffer.concat([prefix, Buffer.from(xml, "utf8"), suffix]);
  const uploaded = await request(
    `${base}/umbraco/articulate/api/v1/blogml/import-file`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
      body,
    },
  );
  const file = parseJsonResponse(uploaded, "BlogML import-file");
  if (!file?.temporaryFileName)
    die("BlogML import-file did not return a temporary file name.");
  const imported = await jsonPost(
    `${base}/umbraco/articulate/api/v1/blogml/import`,
    token,
    {
      articulateBlogNode: rootId,
      tempFile: file.temporaryFileName,
      publish: true,
      overwrite: true,
      importFirstImage: true,
      exportDisqusXml: false,
    },
  );
  if (!imported) die("BlogML import returned an empty response.");
  if (
    !imported.completed ||
    imported.postCount !== 1 ||
    imported.authorCount !== 2
  ) {
    die(`BlogML import returned unexpected stats: ${JSON.stringify(imported)}`);
  }
  const archives = await jsonGet(
    `${base}/umbraco/management/api/v1/tree/document/children?parentId=${rootId}&skip=0&take=100`,
    token,
  );
  for (const [archiveName, postNames] of Object.entries({
    "June Doe": ["Drink tea"],
  })) {
    const archive = (archives.items ?? []).find((item) =>
      (item.variants ?? []).some((variant) => variant.name === archiveName),
    );
    if (!archive)
      die(`BlogML import did not create the '${archiveName}' archive.`);
    const posts = await jsonGet(
      `${base}/umbraco/management/api/v1/tree/document/children?parentId=${archive.id}&skip=0&take=100`,
      token,
    );
    for (const postName of postNames) {
      if (
        !(posts.items ?? []).some((item) =>
          (item.variants ?? []).some((variant) => variant.name === postName),
        )
      ) {
        die(`BlogML import did not create '${postName}' in '${archiveName}'.`);
      }
    }
  }
  console.log(
    `BlogML import passed: ${imported.postCount} posts and ${imported.authorCount} authors.`,
  );
}

async function runFixture(base, token) {
  const result = await jsonPost(
    `${base}/articulate/harness/fixture`,
    token,
    {},
  );
  if (!result?.completed) die("Scoped author fixture did not complete.");
  console.log("Scoped author fixture passed.");
}

async function exportBlogMl(base, token, rootId) {
  const response = await request(
    `${base}/umbraco/articulate/api/v1/blogml/export`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/octet-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        articulateBlogNode: rootId,
        exportImagesAsBase64: true,
      }),
    },
  );
  if (response.status !== 200)
    die(
      `BlogML export returned HTTP ${response.status}: ${response.body.slice(0, 300)}`,
    );
  if (!/<blog\b/i.test(response.body))
    die("BlogML export did not return a BlogML document.");
  for (const title of ["Drink tea", "Latte art"]) {
    if (!response.body.includes(title))
      die(`BlogML export did not contain the imported post '${title}'.`);
  }
  for (const author of ["Jane Doe", "June Doe"]) {
    if (!response.body.includes(author))
      die(`BlogML export did not contain the imported author '${author}'.`);
  }
  if (!response.body.includes("/9j/"))
    die("BlogML export did not contain embedded JPEG image data.");
  console.log(
    "BlogML export passed: valid XML content returned with imported posts.",
  );
}

async function jsonPost(url, token, body) {
  const res = await request(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseJsonResponse(res, url);
}

function parseJsonResponse(res, label) {
  if (res.status < 200 || res.status >= 300) {
    const error = new Error(
      `${label} returned HTTP ${res.status}: ${res.body.slice(0, 240)}`,
    );
    error.status = res.status;
    throw error;
  }

  if (res.status === 204 || !res.body) return null;

  try {
    return JSON.parse(res.body);
  } catch (err) {
    throw new Error(`${label} did not return valid JSON: ${err.message}`);
  }
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function xmlRpcValue(value) {
  if (typeof value === "boolean") return `<boolean>${value ? 1 : 0}</boolean>`;
  if (typeof value === "number") return `<int>${value}</int>`;
  if (Buffer.isBuffer(value))
    return `<base64>${value.toString("base64")}</base64>`;
  if (value && typeof value === "object") {
    const members = Object.entries(value)
      .map(
        ([name, item]) =>
          `<member><name>${xmlEscape(name)}</name><value>${xmlRpcValue(item)}</value></member>`,
      )
      .join("");
    return `<struct>${members}</struct>`;
  }
  return `<string>${xmlEscape(value ?? "")}</string>`;
}

function xmlRpcRequest(method, params) {
  const values = params
    .map((value) => `<param><value>${xmlRpcValue(value)}</value></param>`)
    .join("");
  return `<?xml version="1.0"?><methodCall><methodName>${xmlEscape(method)}</methodName><params>${values}</params></methodCall>`;
}

async function xmlRpcCall(url, username, password, method, params) {
  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const res = await request(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "text/xml",
      Accept: "text/xml",
    },
    body: xmlRpcRequest(method, params),
  });
  if (res.status < 200 || res.status >= 300 || /<fault>/i.test(res.body)) {
    throw new Error(
      `${method} returned HTTP ${res.status}: ${res.body.slice(0, 1000)}`,
    );
  }
  return res.body;
}

function extractRpcPostId(response, title) {
  const block = response.split("<struct>").find((value) => {
    const match = value.match(
      /<name>title<\/name>\s*<value>\s*<string>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/string>/i,
    );
    return match?.[1] === title;
  });
  const match = block?.match(
    /<name>postid<\/name>\s*<value>\s*<string>([^<]+)<\/string>/i,
  );
  return match?.[1] ?? null;
}

async function assertMetaWeblogRejectsMarkdown(
  rpcUrl,
  blogId,
  username,
  password,
  title,
) {
  const recent = await xmlRpcCall(
    rpcUrl,
    username,
    password,
    "metaWeblog.getRecentPosts",
    [blogId, username, password, 20],
  );
  const postId = extractRpcPostId(recent, title);
  if (!postId) {
    die(`MetaWeblog smoke could not find Markdown fixture '${title}'.`);
  }

  try {
    await xmlRpcCall(rpcUrl, username, password, "metaWeblog.editPost", [
      postId,
      username,
      password,
      { title, description: "Unauthorized MetaWeblog Markdown edit" },
      true,
    ]);
    die("MetaWeblog allowed the administrator to save a Markdown post.");
  } catch (error) {
    if (
      !String(error.message).includes("The requested content is not available")
    ) {
      throw error;
    }
    console.log("Confirmed MetaWeblog cannot save Markdown content");
  }
}

async function uploadMediaObject(
  base,
  rpcUrl,
  blogId,
  username,
  password,
  image,
  fileName,
) {
  const uploaded = await xmlRpcCall(
    rpcUrl,
    username,
    password,
    "metaWeblog.newMediaObject",
    [
      blogId,
      username,
      password,
      { bits: image, name: fileName, type: "image/jpeg" },
    ],
  );
  const imageUrl = uploaded.match(
    /<name>url<\/name>\s*<value>\s*<string>([^<]+)<\/string>/i,
  )?.[1];
  if (!imageUrl) {
    die(
      `Open Live Writer smoke could not read the uploaded image URL for ${fileName}.`,
    );
  }
  if (
    !new URL(imageUrl, base).pathname.toLowerCase().includes("/articulate/")
  ) {
    die(
      `Open Live Writer smoke expected ${fileName} in the Articulate file store: ${imageUrl}`,
    );
  }
  return imageUrl;
}

async function assertExtractedMedia(
  base,
  token,
  rootId,
  postTitle,
  secondImageUrl,
  bodyAlias = "richText",
) {
  const rootChildren = await jsonGet(
    `${base}/umbraco/management/api/v1/tree/document/children?parentId=${rootId}&skip=0&take=100`,
    token,
  );
  const fixtureArchive = (rootChildren.items ?? []).find((item) =>
    item.variants?.some((variant) => variant.name === "June Doe"),
  );
  if (!fixtureArchive)
    die("Could not find the fixture archive for media smoke.");

  const posts = await jsonGet(
    `${base}/umbraco/management/api/v1/tree/document/children?parentId=${fixtureArchive.id}&skip=0&take=100`,
    token,
  );
  const post = (posts.items ?? []).find((item) =>
    item.variants?.some((variant) => variant.name === postTitle),
  );
  if (!post) die(`Could not find fixture post '${postTitle}' for media smoke.`);

  const document = await getDocument(base, token, post.id);
  const postImage = document.values?.find(
    (value) => value.alias === "postImage",
  )?.value;
  if (
    !Array.isArray(postImage) ||
    postImage.length !== 1 ||
    !postImage[0]?.mediaKey
  ) {
    die(
      "Expected exactly one extracted featured image on the Open Live Writer post.",
    );
  }

  const mediaRoots = await jsonGet(
    `${base}/umbraco/management/api/v1/tree/media/root?skip=0&take=100`,
    token,
  );
  const articulateMedia = (mediaRoots.items ?? []).find((item) =>
    item.variants?.some((variant) => variant.name === "Articulate"),
  );
  if (!articulateMedia)
    die("Could not find the Articulate media folder for media smoke.");

  const mediaFolders = await jsonGet(
    `${base}/umbraco/management/api/v1/tree/media/children?parentId=${articulateMedia.id}&skip=0&take=100`,
    token,
  );
  const fixtureMedia = (mediaFolders.items ?? []).find((item) =>
    item.variants?.some((variant) => variant.name === "June Doe"),
  );
  if (!fixtureMedia)
    die("Could not find the fixture media folder for media smoke.");

  const fixtureMediaChildren = await jsonGet(
    `${base}/umbraco/management/api/v1/tree/media/children?parentId=${fixtureMedia.id}&skip=0&take=100`,
    token,
  );
  if (
    !(fixtureMediaChildren.items ?? []).some(
      (item) => item.id === postImage[0].mediaKey,
    )
  ) {
    die(
      "The extracted featured image was not saved in the fixture media folder.",
    );
  }

  const bodyValue = document.values?.find(
    (value) => value.alias === bodyAlias,
  )?.value;
  const body =
    typeof bodyValue === "string" ? bodyValue : (bodyValue?.markup ?? "");
  const secondPath = secondImageUrl
    ? new URL(secondImageUrl, base).pathname
    : body.match(/\/media\/articulate\/[^)" ]+/i)?.[0];
  if (!secondPath || !body.includes(secondPath)) {
    die(`The second image was not retained in the ${bodyAlias} post body.`);
  }
  const secondUrl = new URL(secondPath, base).toString();
  const secondResponse = await request(secondUrl);
  if (secondResponse.status !== 200) {
    die(`The second image was not readable from the filesystem: ${secondUrl}`);
  }

  console.log(
    `Confirmed first ${bodyAlias} image extracted to fixture media and second remains filesystem-backed`,
  );
}

function multipartPart(boundary, name, content, fileName, contentType) {
  const disposition = fileName
    ? `Content-Disposition: form-data; name="${name}"; filename="${fileName}"`
    : `Content-Disposition: form-data; name="${name}"`;
  const type = fileName ? `\r\nContent-Type: ${contentType}` : "";
  return Buffer.concat([
    Buffer.from(`--${boundary}\r\n${disposition}${type}\r\n\r\n`),
    Buffer.isBuffer(content) ? content : Buffer.from(content),
    Buffer.from("\r\n"),
  ]);
}

async function markdownEditorSmoke(base, adminToken, articulateRootId) {
  const username = "JuneDoe";
  const password = "@rticulate";
  const title = "Markdown Editor Smoke Test";
  const home = await request(`${base}/`);
  const numericRootId = home.body.match(/\/rsd\/(\d+)/i)?.[1];
  if (!numericRootId)
    die("Markdown smoke could not discover the numeric Articulate root id.");

  const rootChildren = await jsonGet(
    `${base}/umbraco/management/api/v1/tree/document/children?parentId=${articulateRootId}&skip=0&take=100`,
    adminToken,
  );
  const fixtureArchive = (rootChildren.items ?? []).find((item) =>
    item.variants?.some((variant) => variant.name === "June Doe"),
  );
  if (!fixtureArchive)
    die("Could not find the fixture archive for Markdown smoke cleanup.");
  const existingPosts = await jsonGet(
    `${base}/umbraco/management/api/v1/tree/document/children?parentId=${fixtureArchive.id}&skip=0&take=100`,
    adminToken,
  );
  for (const item of existingPosts.items ?? []) {
    if (item.variants?.some((variant) => variant.name === title)) {
      await jsonDelete(
        `${base}/umbraco/management/api/v1/document/${item.id}`,
        adminToken,
      );
    }
  }

  const credentials = await requestBackOfficeToken(base, username, password);
  const firstImage = await fs.readFile(
    new URL("../src/Articulate/Packaging/post1.jpg", import.meta.url),
  );
  const secondImage = await fs.readFile(
    new URL("../src/Articulate/Packaging/post2.jpg", import.meta.url),
  );
  const json = JSON.stringify({
    articulateBlogNode: Number(numericRootId),
    title,
    body: "![Post one](tmp:post-one)\n\n![Post two](tmp:post-two)",
    excerpt: "Markdown editor smoke test",
  });
  const boundary = `----articulate-markdown-${Date.now()}`;
  const body = Buffer.concat([
    multipartPart(boundary, "json", json),
    multipartPart(
      boundary,
      "tmp:post-one",
      firstImage,
      "post1.jpg",
      "image/jpeg",
    ),
    multipartPart(
      boundary,
      "tmp:post-two",
      secondImage,
      "post2.jpg",
      "image/jpeg",
    ),
    Buffer.from(`--${boundary}--\r\n`),
  ]);
  const response = await request(
    `${base}/umbraco/articulate/api/v1/editors/markdown/post`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        Cookie: credentials.cookie,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
      body,
    },
  );
  if (response.status !== 200) {
    die(
      `Markdown editor smoke failed for the fixture author: HTTP ${response.status} ${response.body.slice(0, 300)}`,
    );
  }

  await assertExtractedMedia(
    base,
    adminToken,
    articulateRootId,
    title,
    "",
    "markdown",
  );
  console.log(`Markdown editor smoke passed for the fixture author: ${title}`);
}

// --- retry helpers ----------------------------------------------------------

async function retry(fn, deadline, label) {
  while (now() < deadline) {
    try {
      const result = await fn();
      if (result !== undefined) return result;
    } catch (error) {
      const status = error?.status;
      if (status >= 400 && status < 500 && status !== 408 && status !== 429)
        throw error;
    }
    await sleep(2000);
  }
  die(`Timed out: ${label}`);
}

async function poll(fn, deadline, label) {
  while (now() < deadline) {
    if (await fn()) return;
    await sleep(2000);
  }
  die(`Timed out: ${label}`);
}

// --- Token / Management API operations --------------------------------------

async function requestToken(base, clientId, clientSecret, timeoutSec) {
  const deadline = now() + timeoutSec;
  const tokenResp = await retry(
    () =>
      post(`${base}/umbraco/management/api/v1/security/back-office/token`, {
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    deadline,
    "token endpoint",
  );
  if (!tokenResp.access_token)
    die("Token endpoint did not return an access token.");
  return tokenResp.access_token;
}

function cookieHeader(setCookies = []) {
  return setCookies.map((value) => value.split(";", 1)[0]).join("; ");
}

async function requestBackOfficeToken(base, username, password) {
  const loginBody = JSON.stringify({ username, password });
  const login = await request(
    `${base}/umbraco/management/api/v1/security/back-office/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(loginBody),
        Origin: base,
        Referer: `${base}/`,
      },
      body: loginBody,
    },
  );
  if (login.status !== 200) {
    die(`Backoffice login failed for ${username}: HTTP ${login.status}`);
  }

  const sessionCookie = cookieHeader(login.headers["set-cookie"]);
  const codeVerifier = "articulate-markdown-smoke-verifier";
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const redirectUri = `${base}/umbraco/oauth_complete`;
  const authorizeUrl = new URL(
    "/umbraco/management/api/v1/security/back-office/authorize",
    base,
  );
  authorizeUrl.search = new URLSearchParams({
    client_id: "umbraco-back-office",
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state: "articulate-markdown-smoke",
    scope: "offline_access",
    prompt: "consent",
    access_type: "offline",
  });
  const authorization = await request(authorizeUrl.toString(), {
    headers: { Cookie: sessionCookie, Referer: `${base}/` },
  });
  const code = authorization.headers.location
    ? new URL(authorization.headers.location, base).searchParams.get("code")
    : null;
  if (authorization.status !== 302 || !code) {
    die(
      `Backoffice authorization failed for ${username}: HTTP ${authorization.status}`,
    );
  }

  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: "umbraco-back-office",
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    code,
  });
  const tokenResponse = await request(
    `${base}/umbraco/management/api/v1/security/back-office/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(form.toString()),
        Cookie: [
          sessionCookie,
          cookieHeader(authorization.headers["set-cookie"]),
        ]
          .filter(Boolean)
          .join("; "),
        Origin: base,
      },
      body: form.toString(),
    },
  );
  let token = null;
  try {
    token =
      tokenResponse.status === 200 ? JSON.parse(tokenResponse.body) : null;
  } catch {
    die(`Backoffice token exchange returned invalid JSON for ${username}.`);
  }
  if (!token?.access_token) {
    die(
      `Backoffice token exchange failed for ${username}: HTTP ${tokenResponse.status}`,
    );
  }
  return {
    accessToken: token.access_token,
    cookie: cookieHeader(tokenResponse.headers["set-cookie"]),
  };
}

async function findArticulateRoot(base, token) {
  const data = await jsonGet(
    `${base}/umbraco/management/api/v1/tree/document/root?skip=0&take=100`,
    token,
  );
  const items = data?.items ?? [];
  const articulate =
    items.find((i) => i.documentType?.alias === "Articulate") ?? items[0];
  if (!articulate?.id)
    die("Could not find an Articulate root document in the document tree.");
  return articulate.id;
}

async function getDocument(base, token, id) {
  return jsonGet(`${base}/umbraco/management/api/v1/document/${id}`, token);
}

async function updateDocument(base, token, id, values, variantName) {
  // Read-modify-write: Management API PUT /document replaces the values
  // collection, so a partial payload would wipe required properties
  // (blogTitle, pageSize, ...) and cause publish to 400.
  const current = await getDocument(base, token, id);
  const merged = new Map((current.values ?? []).map((v) => [v.alias, v]));
  for (const change of values) merged.set(change.alias, change);
  await jsonPut(`${base}/umbraco/management/api/v1/document/${id}`, token, {
    values: Array.from(merged.values()),
    variants: [{ culture: null, name: variantName }],
  });
}

async function publishRoot(base, token, rootId) {
  console.log("Publishing root");
  await jsonPut(
    `${base}/umbraco/management/api/v1/document/${rootId}/publish`,
    token,
    {
      publishSchedules: [{ culture: null, schedule: null }],
    },
  );
}

async function reloadCache(base, token) {
  const url = `${base}/umbraco/management/api/v1/published-cache/reload`;
  const res = await request(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      `${url} returned HTTP ${res.status}: ${res.body.slice(0, 240)}`,
    );
  }
}

async function publishWithDescendants(base, token, id, label, timeoutSec) {
  console.log(`Publishing with descendants: ${label} (${id})`);
  const result = await jsonPut(
    `${base}/umbraco/management/api/v1/document/${id}/publish-with-descendants`,
    token,
    {
      cultures: ["invariant"],
      includeUnpublishedDescendants: true,
    },
  );
  if (result?.taskId) {
    const taskUrl = `${base}/umbraco/management/api/v1/document/${id}/publish-with-descendants/result/${result.taskId}`;
    await poll(
      async () => {
        const status = await jsonGet(taskUrl, token);
        return status?.isComplete === true;
      },
      now() + timeoutSec,
      `publish-with-descendants task ${result.taskId} for ${label}`,
    );
  }
}

async function waitForRoot(base, timeoutSec) {
  await poll(
    async () => {
      try {
        const res = await request(`${base}/`, { timeout: 15_000 });
        return res.status === 200;
      } catch {
        return false;
      }
    },
    now() + timeoutSec,
    `/ to return 200`,
  );
}

async function confirmChildren(base, token, parentId, indent = "") {
  let unpublished = 0;
  let skip = 0;
  while (true) {
    const data = await jsonGet(
      `${base}/umbraco/management/api/v1/tree/document/children?parentId=${parentId}&skip=${skip}&take=100`,
      token,
    );
    const items = data?.items ?? [];
    for (const item of items) {
      const variant = item.variants?.[0] ?? {};
      const state = variant.state ?? "unknown";
      const name = variant.name || item.name || item.id;
      const tag = item.hasChildren ? " (has children)" : "";
      console.log(`${indent}Child '${name}' (${item.id}) state=${state}${tag}`);
      if (state !== "Published") unpublished++;
      if (item.hasChildren)
        unpublished += await confirmChildren(
          base,
          token,
          item.id,
          `${indent}  `,
        );
    }
    if (items.length < 100) break;
    skip += items.length;
  }
  return unpublished;
}

// --- Theme helpers ----------------------------------------------------------

function getThemeCssMarker(themeName) {
  const lower = (themeName || "").toLowerCase();
  return `/App_Plugins/Articulate/Themes/${lower}/assets/dist/css/${lower}.min.css`;
}

function getAltTheme(currentTheme) {
  const current = (currentTheme || "VAPOR").toLowerCase();
  return current === "vapor" ? "Material" : "VAPOR";
}

async function verifyThemeInHtml(base, expectedTheme, timeoutSec) {
  // Theme folders are title-/upper-case on disk (Material, VAPOR, ...) so
  // match case-insensitively against the served HTML.
  const marker = getThemeCssMarker(expectedTheme).toLowerCase();
  await poll(
    async () => {
      try {
        const res = await request(`${base}/`, { timeout: 15_000 });
        if (res.status !== 200) return false;
        return res.body.toLowerCase().includes(marker);
      } catch {
        return false;
      }
    },
    now() + timeoutSec,
    `HTML to contain theme CSS marker: ${marker}`,
  );
}

async function openLiveWriterSmoke(base, token, articulateRootId) {
  const username = "JuneDoe"; // deterministic fixture author account
  const password = "@rticulate";
  const title = "Open Live Writer Smoke Test";
  const home = await request(`${base}/`);
  const rsdRootId = home.body.match(/\/rsd\/(\d+)/i)?.[1];
  if (!rsdRootId) {
    die(
      `Open Live Writer smoke could not discover the blog route. Response: ${home.body.slice(0, 300)}`,
    );
  }

  const rsd = await request(`${base}/rsd/${rsdRootId}`);
  const rpcUrl = rsd.body.match(/apiLink="([^"]*\/metaweblog\/\d+)"/i)?.[1];
  if (!rpcUrl) {
    die(
      `Open Live Writer smoke could not discover the MetaWeblog endpoint. Response: ${rsd.body.slice(0, 300)}`,
    );
  }

  const firstImage = await fs.readFile(
    new URL("../src/Articulate/Packaging/post1.jpg", import.meta.url),
  );
  const secondImage = await fs.readFile(
    new URL("../src/Articulate/Packaging/post2.jpg", import.meta.url),
  );
  console.log(`Open Live Writer smoke as ${username}`);

  const blogs = await xmlRpcCall(
    rpcUrl,
    username,
    password,
    "blogger.getUsersBlogs",
    ["", username, password],
  );
  const blogId = blogs.match(
    /<name>blogid<\/name>\s*<value>\s*<(?:string|int)>([^<]+)<\/(?:string|int)>/i,
  )?.[1];
  if (!blogId) {
    die(
      `Open Live Writer smoke could not discover the blog id. Response: ${blogs.slice(0, 500)}`,
    );
  }

  const markdownTitle = "Welcome";
  await assertMetaWeblogRejectsMarkdown(
    rpcUrl,
    blogId,
    env("UMBRACO_USER_EMAIL", "admin@localhost"),
    env("UMBRACO_USER_PASSWORD", "@rticulate"),
    markdownTitle,
  );

  console.log("Uploading two smoke images to the Articulate file store");
  const imageUrl = await uploadMediaObject(
    base,
    rpcUrl,
    blogId,
    username,
    password,
    firstImage,
    "open-live-writer-post1.jpg",
  );
  const secondImageUrl = await uploadMediaObject(
    base,
    rpcUrl,
    blogId,
    username,
    password,
    secondImage,
    "open-live-writer-post2.jpg",
  );

  const post = {
    title,
    description: `<p>Open Live Writer smoke test.</p><p><a href="${imageUrl}"><img src="${imageUrl}" alt="Post one"></a></p><p><a href="${secondImageUrl}"><img src="${secondImageUrl}" alt="Post two"></a></p>`,
  };
  const recent = await xmlRpcCall(
    rpcUrl,
    username,
    password,
    "metaWeblog.getRecentPosts",
    [blogId, username, password, 20],
  );
  if (!recent.includes("Hi! Welcome to Articulate"))
    die("Open Live Writer read did not return the expected Welcome body.");
  const markdownPostId = extractRpcPostId(recent, markdownTitle);
  if (!markdownPostId) {
    die(
      `Open Live Writer smoke could not find Markdown fixture '${markdownTitle}'.`,
    );
  }

  try {
    await xmlRpcCall(rpcUrl, username, password, "metaWeblog.editPost", [
      markdownPostId,
      username,
      password,
      { title: markdownTitle, description: "Unauthorized edit attempt" },
      true,
    ]);
    die(
      "Open Live Writer smoke: the fixture author could illegally edit the Markdown post.",
    );
  } catch (error) {
    if (!String(error.message).includes("returned HTTP 200")) throw error;
    console.log("Confirmed the fixture author cannot edit the Markdown post");
  }

  let postId = extractRpcPostId(recent, title);
  if (!postId) {
    console.log(`Creating ${title}`);
    postId = await xmlRpcCall(
      rpcUrl,
      username,
      password,
      "metaWeblog.newPost",
      [blogId, username, password, post, true],
    ).then((response) => response.match(/<string>([^<]+)<\/string>/i)?.[1]);
  }
  if (!postId)
    die(
      "Open Live Writer smoke could not find or create its deterministic post.",
    );

  console.log(`Editing and publishing post ${postId}`);
  await xmlRpcCall(rpcUrl, username, password, "metaWeblog.editPost", [
    postId,
    username,
    password,
    post,
    true,
  ]);
  await assertExtractedMedia(
    base,
    token,
    articulateRootId,
    title,
    secondImageUrl,
  );
  console.log(`Open Live Writer smoke passed for ${title}`);
}

// --- main -------------------------------------------------------------------

async function main() {
  const validModes = [
    "publish",
    "confirm",
    "smoke",
    "theme",
    "blogml",
    "fixture",
    "export",
    "markdown",
    "ol",
  ];
  const mode = process.argv[2] || "publish";
  if (!validModes.includes(mode)) {
    die(
      `Usage: smoke.mjs <publish|confirm|smoke|theme|blogml|fixture|export|markdown|ol> [--no-descendants]`,
    );
  }

  const noDescendants = process.argv.includes("--no-descendants");
  const base = env("UMBRACO_PUBLIC_URL", "https://localhost:18443").replace(
    /\/+$/,
    "",
  );
  const timeoutSec = 300;

  // --- smoke mode (no auth needed) ------------------------------------------
  if (mode === "smoke") {
    console.log("Waiting for production root to return 200");
    await waitForRoot(base, timeoutSec);
    console.log("Production smoke passed: / returned 200.");
    return;
  }

  // --- confirm / publish / theme: shared setup (token + root) ---------------
  const clientId = "articulate-dev-automation";
  const clientSecret = env(
    "ARTICULATE_HARNESS_API_CLIENT_SECRET",
    "articulate-dev-local-secret",
  );

  console.log("Requesting access token");
  const token = await requestToken(base, clientId, clientSecret, timeoutSec);

  console.log("Finding Articulate root");
  const rootId = await findArticulateRoot(base, token);
  console.log(`Root id: ${rootId}`);

  // --- BlogML mode ----------------------------------------------------------
  if (mode === "blogml") {
    await uploadBlogMl(base, token, rootId);
    return;
  }

  if (mode === "fixture") {
    await runFixture(base, token);
    return;
  }

  if (mode === "export") {
    await exportBlogMl(base, token, rootId);
    return;
  }

  // --- Markdown editor mode -------------------------------------------------
  if (mode === "markdown") {
    await markdownEditorSmoke(base, token, rootId);
    return;
  }

  // --- Open Live Writer mode ------------------------------------------------
  if (mode === "ol") {
    await openLiveWriterSmoke(base, token, rootId);
    return;
  }

  // --- confirm mode ---------------------------------------------------------
  if (mode === "confirm") {
    console.log("Confirming published children and descendants");
    const missing = await confirmChildren(base, token, rootId);
    if (missing !== 0)
      die("One or more Articulate children are not published.");

    console.log("Verifying public root");
    await waitForRoot(base, timeoutSec);

    console.log("Confirmation passed");
    console.log(
      "Harness API confirmation passed: root, children, and descendants are published and / returns 200.",
    );
    return;
  }

  // --- theme mode -----------------------------------------------------------
  if (mode === "theme") {
    console.log("Reading current document");
    const doc = await getDocument(base, token, rootId);
    const currentTheme =
      doc.values?.find((v) => v.alias === "theme")?.value ?? "VAPOR";
    const variantName = doc.variants?.[0]?.name ?? "Blog";
    console.log(`Current theme: ${currentTheme}`);

    console.log("Verifying current theme renders");
    await verifyThemeInHtml(base, currentTheme, timeoutSec);
    console.log(`Confirmed: HTML contains ${getThemeCssMarker(currentTheme)}`);

    const newTheme = getAltTheme(currentTheme);
    let themeChanged = false;
    try {
      console.log(`Changing theme to: ${newTheme}`);
      await updateDocument(
        base,
        token,
        rootId,
        [{ alias: "theme", value: newTheme }],
        variantName,
      );
      themeChanged = true;

      console.log("Publishing root");
      await publishRoot(base, token, rootId);
      await reloadCache(base, token);

      console.log("Verifying new theme renders");
      await verifyThemeInHtml(base, newTheme, timeoutSec);
      console.log(
        `Theme verification passed: HTML contains ${getThemeCssMarker(newTheme)}`,
      );
    } finally {
      // Restore original theme so iterative dev runs don't drift, even when
      // alternate-theme publishing or verification fails.
      if (themeChanged) {
        console.log("Restoring original theme");
        await updateDocument(
          base,
          token,
          rootId,
          [{ alias: "theme", value: currentTheme }],
          variantName,
        );
        await publishRoot(base, token, rootId);
        await reloadCache(base, token);
        await verifyThemeInHtml(base, currentTheme, timeoutSec);
        console.log("Original theme restored.");
      }
    }
    return;
  }

  // --- publish mode ---------------------------------------------------------
  if (noDescendants) {
    console.log("Publishing root only");
    await publishRoot(base, token, rootId);
  } else {
    console.log("Publishing root before descendants");
    await publishRoot(base, token, rootId);

    console.log("Waiting for root cache");
    await reloadCache(base, token);
    await waitForRoot(base, timeoutSec);

    console.log("Publishing root children with descendants");
    const data = await jsonGet(
      `${base}/umbraco/management/api/v1/tree/document/children?parentId=${rootId}&skip=0&take=100`,
      token,
    );
    const children = (data?.items ?? []).filter(
      (c) => c.hasChildren || c.variants?.[0]?.state !== "Published",
    );
    for (const child of children) {
      const name = child.variants?.[0]?.name ?? child.name ?? child.id;
      await publishWithDescendants(base, token, child.id, name, timeoutSec);
    }

    console.log("Publishing root with descendants");
    await publishWithDescendants(base, token, rootId, "root", timeoutSec);
  }

  console.log("Reloading published cache");
  await reloadCache(base, token);

  console.log("Waiting for public root");
  await waitForRoot(base, timeoutSec);

  console.log("Root is live");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
