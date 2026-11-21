import Link from "next/link";
import { telHref, type SiteSettings } from "@/lib/queries/settings";

const socialLabel: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  x: "X",
  tiktok: "TikTok",
  nextdoor: "Nextdoor",
};

export function TopBar({ settings }: { settings: SiteSettings }) {
  return (
    <div className="bg-teal-700 text-white">
      <div className="container-site eyebrow flex items-center justify-between gap-4 py-2 text-[13px]">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          <li>
            <a className="text-white hover:underline" href={telHref(settings.phone)}>
              {settings.phone}
            </a>
          </li>
          <li className="hidden sm:block">
            <a className="text-white hover:underline" href={`mailto:${settings.email}`}>
              Message us
            </a>
          </li>
          <li>
            <Link className="text-white hover:underline" href="/subscribe/">
              Subscribe
            </Link>
          </li>
        </ul>
        <ul className="hidden gap-4 md:flex" aria-label="Social media">
          {settings.social.map((s) => (
            <li key={s.url}>
              <a className="text-white hover:underline" href={s.url} rel="noopener" target="_blank">
                {socialLabel[s.platform] ?? s.platform}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
