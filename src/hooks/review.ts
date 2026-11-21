import type { CollectionBeforeChangeHook } from "payload";

import { checkFormat, type DeskCollection } from "@/lib/desk/format";

/**
 * Runs the desk format check whenever an item is (or stays) in review, so the
 * Approval queue always shows the current result.
 */
export const reviewCheck =
  (collection: DeskCollection): CollectionBeforeChangeHook =>
  ({ data, originalDoc }) => {
    const review = { ...(originalDoc?.review ?? {}), ...(data.review ?? {}) } as Record<string, unknown>;
    if (review.state !== "in-review") return data;
    const merged = { ...(originalDoc ?? {}), ...data };
    review.check = checkFormat(collection, merged);
    if (originalDoc?.review?.state !== "in-review" || !review.submittedAt) review.submittedAt = new Date().toISOString();
    return { ...data, review };
  };
