"use server";

import sharp from "sharp";

import { EDITORS, sendEmail, summaryEmail } from "@/lib/email";
import {
  contactSchema,
  eventSubmissionSchema,
  guideRequestSchema,
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
  photoSubmissionSchema,
  subscribeSchema,
} from "@/lib/forms/schemas";
import { guard, parseForm, storeSubmission, type FormState } from "@/lib/forms/server";
import { fromLA } from "@/lib/events/recurrence";
import { subscribe } from "@/lib/mailerlite";
import { getPayloadClient } from "@/lib/payload";

const GENERIC_ERROR: FormState = { ok: false, message: "Something went wrong on our side. Please try again, or email hello@sancarloslife.com." };

export async function submitContact(_prev: FormState, form: FormData): Promise<FormState> {
  const g = await guard(form, "contact");
  if (g.stop) return g.stop;
  const { data, state } = parseForm(contactSchema, form);
  if (!data) return state!;
  try {
    await storeSubmission("contact", data, g.ip, g.turnstileOk);
    const mail = summaryEmail("New message from the San Carlos Life contact form.", [
      ["Name", data.name],
      ["Email", data.email],
      ["Phone", data.phone],
      ["Topic", data.topic],
      ["Message", data.message],
    ]);
    await sendEmail({ to: EDITORS, subject: `Contact form: ${data.name}`, replyTo: data.email, ...mail });
    return { ok: true, message: `Thanks, ${data.name.split(" ")[0]}. We read every message and reply within two business days.` };
  } catch (e) {
    console.error("submitContact", e);
    return GENERIC_ERROR;
  }
}

export async function submitSubscribe(_prev: FormState, form: FormData): Promise<FormState> {
  const g = await guard(form, "subscribe");
  if (g.stop) return g.stop;
  const { data, state } = parseForm(subscribeSchema, form);
  if (!data) return state!;
  // The address goes to MailerLite only; we don't keep it (privacy rule).
  const result = await subscribe(data.email, data.list, data.firstName ? { name: data.firstName } : {});
  if (result === "error") return GENERIC_ERROR;
  return { ok: true, message: "You're on the list. Check your inbox to confirm your subscription." };
}

export async function submitEvent(_prev: FormState, form: FormData): Promise<FormState> {
  const g = await guard(form, "event");
  if (g.stop) return g.stop;
  const { data, state } = parseForm(eventSubmissionSchema, form);
  if (!data) return state!;
  try {
    const [y, m, d] = data.date.split("-").map(Number);
    const [sh, sm] = (data.startTime || "00:00").split(":").map(Number);
    const startsAt = fromLA(y, m, d, sh, sm).toISOString();
    const endsAt = data.endTime ? (() => { const [eh, em] = data.endTime!.split(":").map(Number); return fromLA(y, m, d, eh, em).toISOString(); })() : undefined;
    const payload = await getPayloadClient();
    // A pending event that only staff can see until an editor publishes it.
    const event = await payload.create({
      collection: "events",
      overrideAccess: true,
      data: {
        title: data.title,
        generateSlug: true,
        status: "pending",
        startsAt,
        endsAt,
        allDay: !data.startTime,
        cost: data.cost || undefined,
        url: data.url || undefined,
        body: { root: { type: "root", format: "", indent: 0, version: 1, direction: null, children: [`Where: ${[data.venueName, data.address].filter(Boolean).join(", ")}`, ...data.description.split(/\n{2,}/)].map((para) => ({ type: "paragraph", format: "", indent: 0, version: 1, direction: null, textFormat: 0, children: [{ type: "text", text: para.trim(), format: 0, detail: 0, mode: "normal", style: "", version: 1 }] })) } },
        submittedBy: { name: data.organizerName, email: data.organizerEmail, phone: data.organizerPhone || undefined },
      } as never,
    });
    await storeSubmission("event", { ...data, eventId: event.id }, g.ip, g.turnstileOk);
    const mail = summaryEmail("A new event was submitted. It stays hidden until you publish it in the admin (Events, status Pending).", [
      ["Event", data.title],
      ["Date", `${data.date} ${data.startTime || ""}${data.endTime ? `–${data.endTime}` : ""}`],
      ["Where", [data.venueName, data.address].filter(Boolean).join(", ")],
      ["Cost", data.cost],
      ["Link", data.url],
      ["Description", data.description],
      ["From", `${data.organizerName} <${data.organizerEmail}> ${data.organizerPhone || ""}`],
      ["Review", `${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/collections/events/${event.id}`],
    ]);
    await sendEmail({ to: EDITORS, subject: `Event submitted: ${data.title}`, replyTo: data.organizerEmail, ...mail });
    return { ok: true, message: "Thanks! We'll review your event and add it to the calendar, usually within two days." };
  } catch (e) {
    console.error("submitEvent", e);
    return GENERIC_ERROR;
  }
}

export async function submitPhoto(_prev: FormState, form: FormData): Promise<FormState> {
  const g = await guard(form, "photo");
  if (g.stop) return g.stop;
  const { data, state } = parseForm(photoSubmissionSchema, form);
  if (!data) return state!;
  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Please choose a photo.", errors: { photo: "Choose a photo" } };
  if (file.size > PHOTO_MAX_BYTES || !PHOTO_TYPES.includes(file.type)) {
    return { ok: false, message: "Photos must be JPG, PNG, WebP or HEIC, up to 10 MB.", errors: { photo: "JPG, PNG, WebP or HEIC up to 10 MB" } };
  }
  try {
    // Re-encode: strips EXIF location data and anything that isn't an image.
    const buffer = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" })
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const payload = await getPayloadClient();
    const name = `submission-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const media = await payload.create({
      collection: "media",
      overrideAccess: true,
      data: { alt: data.caption, credit: data.name },
      file: { data: buffer, mimetype: "image/jpeg", name, size: buffer.length },
    });
    // Quarantined: pending photos are never shown until approved.
    await payload.create({
      collection: "gallery-photos",
      overrideAccess: true,
      data: { image: media.id, caption: data.caption, photographer: data.name, photographerEmail: data.email, status: "pending", submittedAt: new Date().toISOString() },
    });
    await storeSubmission("photo", { name: data.name, email: data.email, caption: data.caption, location: data.location }, g.ip, g.turnstileOk);
    await sendEmail({
      to: EDITORS,
      subject: `Photo submitted by ${data.name}`,
      replyTo: data.email,
      ...summaryEmail("A photo was sent for the gallery. Approve it in the admin (Gallery photos, status Pending).", [
        ["From", `${data.name} <${data.email}>`],
        ["Caption", data.caption],
        ["Where", data.location],
      ]),
    });
    return { ok: true, message: "Thank you! If your photo is chosen we'll post it with credit to you." };
  } catch (e) {
    console.error("submitPhoto", e);
    return { ok: false, message: "We couldn't read that file as a photo. Please try a JPG or PNG." };
  }
}

export async function requestGuide(_prev: FormState, form: FormData): Promise<FormState> {
  const g = await guard(form, "guide");
  if (g.stop) return g.stop;
  const { data, state } = parseForm(guideRequestSchema, form);
  if (!data) return state!;
  try {
    await storeSubmission("guide", data, g.ip, g.turnstileOk);
    const guideName = data.guide === "buyer" ? "San Carlos Buyer's Guide" : "San Carlos Seller's Guide";
    const link = process.env[data.guide === "buyer" ? "GUIDE_BUYER_URL" : "GUIDE_SELLER_URL"];
    await sendEmail({
      to: data.email,
      subject: `Your ${guideName}`,
      text: link
        ? `Hi ${data.name.split(" ")[0]},\n\nHere is your ${guideName}: ${link}\n\nQuestions? Reply to this email or call Viv & Mark at +1 650 291 7241.\n\nSan Carlos Life`
        : `Hi ${data.name.split(" ")[0]},\n\nThanks for asking for the ${guideName}. Viv or Mark will send it to you shortly.\n\nSan Carlos Life`,
    });
    await sendEmail({
      to: EDITORS,
      subject: `Guide request: ${guideName} for ${data.name}`,
      replyTo: data.email,
      ...summaryEmail("Someone asked for a guide.", [
        ["Guide", guideName],
        ["Name", data.name],
        ["Email", data.email],
        ["Phone", data.phone],
        ["Timeline", data.timeline],
      ]),
    });
    await subscribe(data.email, "guides", { name: data.name });
    return { ok: true, message: `Thanks! The ${guideName} is on its way to ${data.email}.` };
  } catch (e) {
    console.error("requestGuide", e);
    return GENERIC_ERROR;
  }
}
