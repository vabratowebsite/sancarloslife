const TZ = "America/Los_Angeles";

export const formatDate = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: "long" }) =>
  iso ? new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...opts }).format(new Date(iso)) : "";

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(new Date(iso));

/** "Sun Nov 8 · 11:00 AM" (the event card label in the mockups). */
export const eventLabel = (startsAt: string, allDay?: boolean | null) => {
  const day = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" })
    .format(new Date(startsAt))
    .replace(",", "");
  return allDay ? `${day} · All day` : `${day} · ${formatTime(startsAt)}`;
};

/** Plain text from a Lexical document (first paragraphs), for descriptions and cards. */
export function plainText(doc: unknown, max = 200): string {
  const parts: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object" || parts.join(" ").length > max * 2) return;
    const n = node as { text?: string; children?: unknown[]; fields?: { html?: string } };
    if (typeof n.text === "string") parts.push(n.text);
    if (n.fields?.html) parts.push(n.fields.html.replace(/<[^>]+>/g, " "));
    n.children?.forEach(walk);
  };
  walk((doc as { root?: unknown })?.root);
  const t = parts.join(" ").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, t.lastIndexOf(" ", max)) + "…" : t;
}
