import "server-only";

import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import https from "node:https";
import zlib from "node:zlib";

import { JSDOM } from "jsdom";

import { checkUrl, isPrivateAddress } from "./urlCheck";

export { checkUrl, isPrivateAddress };

/**
 * Server-side source fetching for the backup runner. Sources are typed in the
 * admin, so treat them as untrusted: https only, port 443, no private or
 * internal addresses (checked on the address actually connected to, so DNS
 * tricks can't slip past), at most 3 redirects, 1.5 MB, 15 seconds.
 */

export const LIMITS = { maxBytes: 1_500_000, timeoutMs: 15_000, maxRedirects: 3, maxChars: 6_000 };

/** DNS lookup that refuses non-public answers; used for the actual connection. */
function publicLookup(hostname: string, options: object, cb: (err: Error | null, address: string | LookupAddress[], family?: number) => void) {
  dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return cb(err, "");
    const list = addresses as LookupAddress[];
    const bad = list.find((a) => isPrivateAddress(a.address));
    if (!list.length || bad) return cb(new Error("The source resolves to a private address"), "");
    if ((options as { all?: boolean }).all) return cb(null, list);
    cb(null, list[0].address, list[0].family);
  });
}

type Fetched = { url: string; status: number; contentType: string; body: string };
type FetchedBytes = Omit<Fetched, "body"> & { bytes: Buffer };
type GetOpts = { maxBytes: number; accept: string };

const PAGE_ACCEPT = "application/rss+xml, application/atom+xml, text/html, text/xml;q=0.9, */*;q=0.5";

function getOnce(u: URL, opts: GetOpts): Promise<FetchedBytes & { location?: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      u,
      {
        lookup: publicLookup as never,
        headers: { "User-Agent": "SanCarlosLife-DeskRunner/1.0 (+https://sancarloslife.com)", Accept: opts.accept, "Accept-Encoding": "gzip, deflate, br" },
        timeout: LIMITS.timeoutMs,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ url: u.href, status, contentType: "", bytes: Buffer.alloc(0), location: res.headers.location });
        }
        const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
        const stream = enc === "gzip" ? res.pipe(zlib.createGunzip()) : enc === "deflate" ? res.pipe(zlib.createInflate()) : enc === "br" ? res.pipe(zlib.createBrotliDecompress()) : res;
        const declared = Number(res.headers["content-length"] ?? 0);
        if (declared > opts.maxBytes) {
          req.destroy();
          return reject(new Error(`The file is larger than ${Math.round(opts.maxBytes / 1e6)} MB`));
        }
        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (c: Buffer) => {
          size += c.length;
          if (size > opts.maxBytes) {
            req.destroy();
            reject(new Error(`The file is larger than ${Math.round(opts.maxBytes / 1e5) / 10} MB`));
          } else chunks.push(c);
        });
        stream.on("end", () => resolve({ url: u.href, status, contentType: String(res.headers["content-type"] ?? ""), bytes: Buffer.concat(chunks) }));
        stream.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("The source took longer than 15 seconds")));
    req.on("error", reject);
  });
}

async function fetchFollowing(raw: string, opts: GetOpts): Promise<FetchedBytes> {
  let u = checkUrl(raw);
  for (let hop = 0; hop <= LIMITS.maxRedirects; hop++) {
    const r = await getOnce(u, opts);
    if (!r.location) {
      if (r.status >= 400) throw new Error(`The source answered ${r.status}`);
      return r;
    }
    u = checkUrl(new URL(r.location, u).href);
  }
  throw new Error("Too many redirects");
}

/** A page or feed as text (1.5 MB). */
export async function safeFetch(raw: string): Promise<Fetched> {
  const r = await fetchFollowing(raw, { maxBytes: LIMITS.maxBytes, accept: PAGE_ACCEPT });
  return { url: r.url, status: r.status, contentType: r.contentType, body: r.bytes.toString("utf8") };
}

/** A binary file (e.g. a photo), same address rules, its own size limit. */
export async function safeFetchBytes(raw: string, opts: { maxBytes: number; accept: string }): Promise<FetchedBytes> {
  return fetchFollowing(raw, opts);
}

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** Visible text of a node, with a space between elements so headings and paragraphs don't run together. */
function textOf(node: Node | null | undefined): string {
  if (!node) return "";
  const doc = node.ownerDocument ?? (node as Document);
  const walker = doc.createTreeWalker(node, 4 /* NodeFilter.SHOW_TEXT */);
  const out: string[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/i.test(n.parentNode?.nodeName ?? "")) continue;
    out.push(n.nodeValue ?? "");
  }
  return clean(out.join(" ")).replace(/ ([.,;:!?])/g, "$1");
}

/** Feed items or page text, as plain text for the AI (never HTML, never scripts). */
export function extractText(body: string, contentType: string, url: string): { title: string; text: string; items: number } {
  const looksXml = /xml|rss|atom/i.test(contentType) || /^\s*<\?xml|<rss[\s>]|<feed[\s>]/i.test(body.slice(0, 500));
  if (looksXml) {
    const doc = new JSDOM(body, { contentType: "text/xml" }).window.document;
    const title = clean(doc.querySelector("channel > title, feed > title")?.textContent);
    const entries = [...doc.querySelectorAll("item, entry")].slice(0, 25).map((el) => {
      const t = clean(el.querySelector("title")?.textContent);
      const link = clean(el.querySelector("link")?.textContent) || el.querySelector("link")?.getAttribute("href") || "";
      const date = clean(el.querySelector("pubDate, published, updated")?.textContent);
      const html = el.querySelector("description, summary, content")?.textContent ?? "";
      const summary = textOf(new JSDOM(`<body>${html}</body>`).window.document.body).slice(0, 400);
      return `- ${t}${date ? ` (${date})` : ""}${link ? `\n  ${link}` : ""}${summary ? `\n  ${summary}` : ""}`;
    });
    return { title: title || url, text: entries.join("\n").slice(0, LIMITS.maxChars), items: entries.length };
  }
  const doc = new JSDOM(body).window.document;
  doc.querySelectorAll("script, style, noscript, svg, nav, footer, header, form, iframe").forEach((n) => n.remove());
  const main = doc.querySelector("main, article, [role=main]") ?? doc.body;
  return { title: clean(doc.title) || url, text: textOf(main).slice(0, LIMITS.maxChars), items: 1 };
}
