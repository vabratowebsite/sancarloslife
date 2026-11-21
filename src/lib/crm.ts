/**
 * Hand-off of our own real-estate leads (Sell My House, homes-for-sale contact)
 * to the Buying Buddy CRM. Buying Buddy hasn't confirmed how outside forms
 * should post leads (docs/PLAN.md open question (d): a lead API or an
 * email-parse address), so this only logs until BUYINGBUDDY_LEAD_EMAIL is set.
 * Every lead is already stored in Form submissions and emailed to Viv & Mark,
 * so nothing is lost meanwhile.
 */
import { sendEmail } from "@/lib/email";

export type Lead = {
  source: "valuation" | "homes-contact";
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export async function pushLead(lead: Lead): Promise<"sent" | "skipped"> {
  const parseAddress = process.env.BUYINGBUDDY_LEAD_EMAIL;
  if (!parseAddress) {
    console.info(`[crm] lead not forwarded (BUYINGBUDDY_LEAD_EMAIL not set): ${lead.source}`);
    return "skipped";
  }
  // Plain key: value lines, the format most CRM email parsers accept.
  const text = [
    `Source: San Carlos Life (${lead.source})`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone && `Phone: ${lead.phone}`,
    lead.address && `Address: ${lead.address}`,
    lead.notes && `Notes: ${lead.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
  await sendEmail({ to: [parseAddress], subject: `New lead: ${lead.name}`, replyTo: lead.email, text });
  return "sent";
}
