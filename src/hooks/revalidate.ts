import { revalidateTag } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";

/**
 * Marks cached pages stale when content changes. Pages read data through
 * src/lib/queries/*, which tag their caches with the same names.
 *
 * Outside a running Next.js server (migration scripts) revalidateTag throws;
 * that is expected and ignored.
 */
export function tagsFor(collection: string, slug?: string | null): string[] {
  return slug ? [collection, `${collection}:${slug}`] : [collection];
}

function safeRevalidate(tags: string[]) {
  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // Not inside a Next.js request (e.g. a CLI script). Nothing to revalidate.
    }
  }
}

type WithSlug = { slug?: string | null };

export const revalidateCollection =
  (collection: string): CollectionAfterChangeHook =>
  ({ doc, previousDoc }) => {
    const tags = new Set([
      ...tagsFor(collection, (doc as WithSlug)?.slug),
      ...tagsFor(collection, (previousDoc as WithSlug)?.slug),
      "search",
      "sitemap",
    ]);
    safeRevalidate([...tags]);
    return doc;
  };

export const revalidateCollectionDelete =
  (collection: string): CollectionAfterDeleteHook =>
  ({ doc }) => {
    safeRevalidate([...tagsFor(collection, (doc as WithSlug)?.slug), "search", "sitemap"]);
    return doc;
  };

export const revalidateGlobal =
  (global: string): GlobalAfterChangeHook =>
  ({ doc }) => {
    safeRevalidate([global]);
    return doc;
  };

/** Both hooks at once, for a collection's `hooks` config. */
export const revalidateHooks = (collection: string) => ({
  afterChange: [revalidateCollection(collection)],
  afterDelete: [revalidateCollectionDelete(collection)],
});
