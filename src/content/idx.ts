/**
 * Buying Buddy widget settings for every IDX slot on the site.
 *
 * Buying Buddy doesn't document its filter syntax publicly; its dashboard's
 * Widget Wizard (Widgets → Widget Wizard) builds the filter string for you.
 * Build the widget there, copy the `data-filter` value, and paste it here.
 * Tokens are joined with "+", e.g. "city:San Carlos+order:price desc+limit:12".
 *
 * Neighborhood pages use the filter saved on each neighborhood in the admin
 * (Neighborhoods → "Buying Buddy filter") instead of the `results` default.
 */

export type IdxWidget = "search" | "results" | "details" | "map" | "open-houses" | "market-report" | "communities";

type Slot = {
  /** Buying Buddy widget type (the `data-type` value). */
  type: string;
  /** Default filter; empty means the widget's own default (the account's listings, or the URL's search). */
  filter?: string;
  /** Fixed height for map-bound widgets. */
  height?: string;
};

export const IDX_SLOTS: Record<IdxWidget, Slot> = {
  search: { type: "SearchForm" },
  // Results follow the visitor's search (query string and cookie); the filter is only the starting point.
  results: { type: "SearchResults", filter: "city:San Carlos+order:list_date desc", height: "900px" },
  details: { type: "SearchDetails" },
  map: { type: "InteractiveMap", filter: "city:San Carlos", height: "600px" },
  // TODO(owner): paste the open-house filter from the Widget Wizard; until then this shows San Carlos listings.
  "open-houses": { type: "FeaturedGallery", filter: "city:San Carlos+limit:12" },
  "market-report": { type: "MarketReport" },
  communities: { type: "Communities" },
};

/** Account activation key (Widgets → Plugin Installation and Setup). Public by design: it only works on authorized domains. */
export function idxKey(): string | undefined {
  return process.env.NEXT_PUBLIC_BUYINGBUDDY_KEY || undefined;
}
