import "server-only";

import { JSDOM } from "jsdom";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { cache, type ReactNode } from "react";

import type { Img } from "@/components/sections";
import { getPayloadClient } from "@/lib/payload";

/**
 * On-page editing for code pages, working like the Operations Desk editor:
 * words and photos can change, layout can't. The page's code is the original;
 * saved changes (collection "page-edits") are laid over it at render time.
 *
 * - Hand-written pages wrap editable words in <T k="…">original</T> and photos
 *   in ei("key", img).
 * - HTML content pages go through applyHtmlEdits(), which numbers every text
 *   node and image in the file (h<n>, p<n>).
 * In edit mode (Next draft mode, entered through /edit/) each editable piece
 * carries data-edit-key / data-edit-img so the editor bar can find it.
 */

export type TextEdit = { from?: string; to: string };
export type ImageEdit = {
  src: string;
  width: number;
  height: number;
  alt: string;
};
export type PageEditData = {
  texts: Record<string, TextEdit>;
  images: Record<string, ImageEdit>;
};

const EMPTY: PageEditData = { texts: {}, images: {} };

async function fetchEdits(page: string): Promise<PageEditData> {
  const payload = await getPayloadClient();
  const doc = (
    await payload.find({
      collection: "page-edits",
      where: { page: { equals: page } },
      limit: 1,
      depth: 0,
    })
  ).docs[0];
  if (!doc) return EMPTY;
  return {
    texts: (doc.texts as PageEditData["texts"]) ?? {},
    images: (doc.images as PageEditData["images"]) ?? {},
  };
}

export const getPageEdits = (page: string) =>
  unstable_cache(() => fetchEdits(page), ["page-edits", page], {
    tags: ["page-edits", `page-edits:${page}`],
    revalidate: 3600,
  })();

/** Per-request state: which page is rendering, its edits, and whether edit mode is on. */
const store = cache(() => ({
  page: "",
  path: "",
  editing: false,
  edits: EMPTY,
}));

/** Call at the top of an editable page, before rendering anything that uses T or ei. */
export async function editablePage(page: string, path: string) {
  const s = store();
  s.page = page;
  s.path = path;
  s.editing = (await draftMode()).isEnabled;
  // In edit mode always read fresh, so a save shows up straight away.
  s.edits = s.editing ? await fetchEdits(page) : await getPageEdits(page);
  return s;
}

/** The current words for a key as a plain string (for structured data and attributes). */
export function tx(k: string, original: string): string {
  return store().edits.texts[k]?.to || original;
}

/** Editable words on a hand-written page. `children` is the original text. */
export function T({ k, children }: { k: string; children: string }) {
  const s = store();
  const edit = s.edits.texts[k];
  const text = edit?.to || children;
  if (!s.editing) return <>{text}</>;
  return (
    <span data-edit-key={k} data-orig={children}>
      {text}
    </span>
  );
}

/** An editable photo: the saved swap if there is one, plus the marker the editor needs. */
export type EditableImg = Img & { editKey?: string; origSrc?: string };

export function ei(k: string, img: Img): EditableImg {
  const s = store();
  const swap = s.edits.images[k];
  const out = swap ? { ...img, ...swap } : img;
  return s.editing ? { ...out, editKey: k, origSrc: img.src } : out;
}

/** Attributes to spread on an <Image> so the editor can swap it (only in edit mode). */
export const editImgAttrs = (img: {
  editKey?: string;
  origSrc?: string;
  src: string;
  alt?: string;
  width: number;
  height: number;
}) =>
  img.editKey
    ? {
        "data-edit-img": img.editKey,
        "data-w": img.width,
        "data-h": img.height,
        "data-edit-src": img.src,
        "data-edit-orig": img.origSrc ?? img.src,
        "data-edit-alt": img.alt ?? "",
      }
    : {};

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);

/**
 * Lays saved changes over a content page's HTML. Text nodes and images are
 * numbered in document order; a text change also remembers the original words
 * (`from`), so it still lands if the file is edited and the numbering shifts.
 */
export function applyHtmlEdits(
  html: string,
  edits: PageEditData,
  editing: boolean,
  /** Key prefix when one page holds several HTML blocks (rebuilt WordPress pages: "s2-r0-c1-i0."). */
  prefix = "",
): string {
  const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
  const doc = dom.window.document;
  const walker = doc.createTreeWalker(
    doc.body,
    dom.window.NodeFilter.SHOW_TEXT,
    {
      acceptNode: (n) =>
        n.nodeValue?.trim() && !SKIP.has(n.parentElement?.tagName ?? "")
          ? 1
          : 3,
    },
  );
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode())
    nodes.push(n as Text);

  const originals = nodes.map((n) => n.nodeValue!.trim());
  const used = new Set<Text>();
  const setText = (node: Text, to: string) => {
    const v = node.nodeValue ?? "";
    const lead = v.match(/^\s*/)![0];
    const trail = v.match(/\s*$/)![0];
    node.nodeValue = `${lead}${to}${trail}`;
  };
  for (const [key, edit] of Object.entries(edits.texts)) {
    if (!key.startsWith(prefix)) continue;
    const local = key.slice(prefix.length);
    if (!/^h\d+$/.test(local) || !edit?.to) continue;
    let node: Text | undefined = nodes[Number(local.slice(1))];
    if (
      node &&
      edit.from !== undefined &&
      node.nodeValue?.trim() !== edit.from
    ) {
      node = nodes.find(
        (n) => !used.has(n) && n.nodeValue?.trim() === edit.from,
      );
    }
    if (!node) continue;
    used.add(node);
    setText(node, edit.to);
  }
  const imgs = [...doc.body.querySelectorAll("img")];
  imgs.forEach((img, i) => {
    const key = `${prefix}p${i}`;
    const swap = edits.images[key];
    const orig = img.getAttribute("src") || "";
    if (swap) {
      img.setAttribute("src", swap.src);
      img.setAttribute("alt", swap.alt);
      img.setAttribute("width", String(swap.width));
      img.setAttribute("height", String(swap.height));
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
    }
    if (editing) {
      img.setAttribute("data-edit-img", key);
      img.setAttribute("data-w", img.getAttribute("width") || "");
      img.setAttribute("data-h", img.getAttribute("height") || "");
      img.setAttribute("data-edit-src", img.getAttribute("src") || "");
      img.setAttribute("data-edit-orig", orig);
      img.setAttribute("data-edit-alt", img.getAttribute("alt") || "");
    }
  });
  if (editing) {
    nodes.forEach((node, i) => {
      const span = doc.createElement("span");
      span.setAttribute("data-edit-key", `${prefix}h${i}`);
      // The file's own words, so Save can tell what changed.
      span.setAttribute("data-orig", originals[i]);
      node.parentNode!.insertBefore(span, node);
      span.appendChild(node);
    });
  }
  return doc.body.innerHTML;
}

/** Hidden marker: tells the editor (and the "Edit this page" button) which page this is. */
export function EditMarker(): ReactNode {
  const s = store();
  return <div hidden data-edit-page={s.page} data-edit-path={s.path} />;
}
