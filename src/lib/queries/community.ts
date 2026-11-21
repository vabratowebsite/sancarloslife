import { unstable_cache } from "next/cache";

import { getPayloadClient } from "@/lib/payload";
import type { CityProject, Park, Testimonial, TimelineEntry } from "@/payload-types";

export const listParks = unstable_cache(
  async (): Promise<Park[]> => {
    const payload = await getPayloadClient();
    return (await payload.find({ collection: "parks", where: { _status: { equals: "published" } }, sort: "name", limit: 100, depth: 1 })).docs;
  },
  ["parks"],
  { tags: ["parks"], revalidate: 3600 },
);

export const listTimeline = unstable_cache(
  async (): Promise<TimelineEntry[]> => {
    const payload = await getPayloadClient();
    return (await payload.find({ collection: "timeline-entries", sort: ["year", "sort"], limit: 500, depth: 1, pagination: false })).docs;
  },
  ["timeline"],
  { tags: ["timeline-entries"], revalidate: 3600 },
);

export const getCityProject = (slug: string) =>
  unstable_cache(
    async (): Promise<CityProject | null> => {
      const payload = await getPayloadClient();
      return (
        await payload.find({ collection: "city-projects", where: { slug: { equals: slug }, _status: { equals: "published" } }, limit: 1, depth: 1 })
      ).docs[0] ?? null;
    },
    ["city-project", slug],
    { tags: ["city-projects", `city-projects:${slug}`], revalidate: 3600 },
  )();

export const listTestimonials = (featuredOnly: boolean, limit: number) =>
  unstable_cache(
    async (): Promise<Testimonial[]> => {
      const payload = await getPayloadClient();
      return (
        await payload.find({
          collection: "testimonials",
          where: featuredOnly ? { featured: { equals: true } } : {},
          sort: ["-featured", "-date", "id"],
          limit,
          depth: 0,
        })
      ).docs;
    },
    ["testimonials", String(featuredOnly), String(limit)],
    { tags: ["testimonials"], revalidate: 3600 },
  )();
