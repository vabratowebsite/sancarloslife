import type { DiviLayout } from "@/components/divi/DiviPage";

import about_san_carlos from "@/content/divi/about-san-carlos.json";
import alder_manor from "@/content/divi/alder-manor.json";
import attractions from "@/content/divi/attractions.json";
import beverly_terrace from "@/content/divi/beverly-terrace.json";
import clearfield_park from "@/content/divi/clearfield-park.json";
import cordes from "@/content/divi/cordes.json";
import el_sereno from "@/content/divi/el-sereno.json";
import events_and_activities from "@/content/divi/events-and-activities.json";
import history_of_san_carlos from "@/content/divi/history-of-san-carlos.json";
import hometown_days from "@/content/divi/hometown-days.json";
import howard_park from "@/content/divi/howard-park.json";
import living_guide from "@/content/divi/living-in-san-carlos-ca-the-complete-guide.json";
import parks_of_san_carlos from "@/content/divi/parks-of-san-carlos.json";
import restaurants_and_services from "@/content/divi/restaurants-and-services.json";
import san_carlos_centennial_2025_celebrating_100_years from "@/content/divi/san-carlos-centennial-2025-celebrating-100-years.json";

/** Pages rendered from their WordPress layout (scripts/migrate/95-divi-layouts.py), plus the
 * Living in San Carlos guide written in the same format (scripts/content/living-guide.py). */
const LAYOUTS: Record<string, unknown> = {
  "about-san-carlos": about_san_carlos,
  "alder-manor": alder_manor,
  "attractions": attractions,
  "beverly-terrace": beverly_terrace,
  "clearfield-park": clearfield_park,
  "cordes": cordes,
  "el-sereno": el_sereno,
  "events-and-activities": events_and_activities,
  "history-of-san-carlos": history_of_san_carlos,
  "hometown-days": hometown_days,
  "howard-park": howard_park,
  "living-in-san-carlos-ca-the-complete-guide": living_guide,
  "parks-of-san-carlos": parks_of_san_carlos,
  "restaurants-and-services": restaurants_and_services,
  "san-carlos-centennial-2025-celebrating-100-years": san_carlos_centennial_2025_celebrating_100_years,
};

export function diviLayout(slug: string): DiviLayout | null {
  return (LAYOUTS[slug] as DiviLayout | undefined) ?? null;
}
