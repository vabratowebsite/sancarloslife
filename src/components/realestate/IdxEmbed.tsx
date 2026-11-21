import Link from "next/link";

import { BbWidget } from "@/components/realestate/BbWidget";
import { IDX_SLOTS, idxKey, type IdxWidget } from "@/content/idx";
import { getSettings, telHref } from "@/lib/queries/settings";

export type { IdxWidget };

/**
 * Every IDX slot on the site. With NEXT_PUBLIC_BUYINGBUDDY_KEY set it renders
 * the Buying Buddy widget (types and filters in src/content/idx.ts) followed by
 * the MLS disclaimer; without a key, or if Buying Buddy's script can't load,
 * it renders the contact fallback below.
 *
 * `filterId` is a neighborhood's Buying Buddy filter from the admin; it
 * replaces the slot's default filter. Pages with two slots pass
 * `disclaimer={false}` on all but the last so the disclaimer shows once.
 */
export async function IdxEmbed({
  widget,
  filterId,
  label,
  disclaimer = true,
}: {
  widget: IdxWidget;
  filterId?: string | null;
  label?: string;
  disclaimer?: boolean;
}) {
  const { phone } = await getSettings();
  const fallback = <IdxFallback widget={widget} filterId={filterId} label={label} phone={phone} />;
  const key = idxKey();
  if (!key) return fallback;

  const slot = IDX_SLOTS[widget];
  return (
    <section aria-label={label ?? "MLS listings"} data-idx-widget={widget}>
      <BbWidget
        activationKey={key}
        type={slot.type}
        filter={filterId?.trim() || slot.filter}
        height={slot.height}
        disclaimer={disclaimer}
        fallback={fallback}
      />
    </section>
  );
}

function IdxFallback({ widget, filterId, label, phone }: { widget: IdxWidget; filterId?: string | null; label?: string; phone: string }) {
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
