import Link from "next/link";

import { getSettings, telHref } from "@/lib/queries/settings";

export type IdxWidget = "search" | "results" | "details" | "map" | "open-houses" | "market-report" | "communities";

/**
 * Where Buying Buddy's IDX widgets go (milestone 18). The @buyingbuddy/react
 * package isn't installed yet (it needs the owner's go-ahead and the $49/mo
 * Agent plan activation key), so every slot renders the same fallback: a short
 * explanation and two ways to get listings from Viv & Mark. When the package is
 * added, this component is the only place that changes; pages already pass the
 * widget type and the neighborhood's hotsheet filter id.
 */
export async function IdxEmbed({ widget, filterId, label }: { widget: IdxWidget; filterId?: string | null; label?: string }) {
  const { phone } = await getSettings();
  return (
    <div
      className="rounded-card border-2 border-dashed border-teal-500/50 bg-teal-50 p-6 md:p-8"
      data-idx-widget={widget}
      data-idx-filter={filterId || undefined}
    >
      <p className="eyebrow text-teal-700">{label ?? "Live MLS listings"}</p>
      <p className="mt-2 max-w-2xl font-heading text-[22px] leading-snug">Live listings are on their way to the new San Carlos Life.</p>
      <p className="mt-2 max-w-2xl text-ink-500">
        Meanwhile, Viv and Mark can send you every new San Carlos listing that fits what you&rsquo;re looking for, often before it hits the
        big portals.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/contact-us/"
          className="eyebrow inline-flex rounded-button border-2 border-teal-700 bg-teal-700 px-5 py-3 text-white no-underline hover:border-teal-500 hover:bg-teal-500"
        >
          Ask Viv &amp; Mark
        </Link>
        <a
          href={telHref(phone)}
          className="eyebrow inline-flex rounded-button border-2 border-teal-700 px-5 py-3 text-teal-700 no-underline hover:bg-white"
        >
          Call {phone}
        </a>
      </div>
    </div>
  );
}
