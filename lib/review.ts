import type { Json } from "@/lib/supabase/database.types";

/** Product columns an editor can't change on a live product directly; changes go to the review queue. */
export const CONTENT_FIELDS = {
  name: "Name",
  slug: "URL slug",
  brand: "Brand",
  brand_id: "Brand page",
  category_id: "Category",
  subcategory: "Subcategory",
  emoji: "Emoji",
  image: "Image",
  tags: "Tags",
  vibes: "Vibes",
  description: "Description",
  highlights: "Highlights",
  is_new: "NEW badge",
  trending: "Trending",
  rating: "Rating",
  review_count: "Review count",
} as const;

export type ContentField = keyof typeof CONTENT_FIELDS;
export const CONTENT_KEYS = Object.keys(CONTENT_FIELDS) as ContentField[];

/** What a review request carries, as stored in product_change_requests.changes. */
export type ChangeSet = {
  product?: { [k: string]: Json };
  offers?: { [retailerId: string]: { url: string } };
};

export const asChangeSet = (c: Json): ChangeSet => (c && typeof c === "object" && !Array.isArray(c) ? (c as ChangeSet) : {});

/** Human labels for everything a request changes, e.g. ["Name", "Shopee link"]. */
export function changeLabels(c: ChangeSet, storeName: (id: string) => string = (id) => id) {
  return [
    ...Object.keys(c.product ?? {}).map((k) => CONTENT_FIELDS[k as ContentField] ?? k),
    ...Object.keys(c.offers ?? {}).map((id) => `${storeName(id)} link`),
  ];
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
