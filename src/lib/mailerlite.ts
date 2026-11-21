import "server-only";

/** Group ids per list, from env (MAILERLITE_GROUP_NEWSLETTER etc.). */
const GROUPS: Record<string, string | undefined> = {
  newsletter: process.env.MAILERLITE_GROUP_NEWSLETTER,
  events: process.env.MAILERLITE_GROUP_EVENTS,
  "real-estate": process.env.MAILERLITE_GROUP_REAL_ESTATE,
  guides: process.env.MAILERLITE_GROUP_GUIDES,
};

/**
 * Adds or updates a subscriber in MailerLite. Addresses are not kept in our
 * database (blueprint privacy rule). Without MAILERLITE_API_KEY nothing is sent.
 */
export async function subscribe(email: string, list: string, fields: Record<string, string> = {}): Promise<"ok" | "skipped" | "error"> {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) {
    console.info(`[MailerLite skipped: no MAILERLITE_API_KEY] ${list}`);
    return "skipped";
  }
  const group = GROUPS[list];
  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, fields, ...(group ? { groups: [group] } : {}) }),
  }).catch(() => null);
  if (!res?.ok) {
    console.error("MailerLite error", res?.status, await res?.text().catch(() => ""));
    return "error";
  }
  return "ok";
}
