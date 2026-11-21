import { z } from "zod";

/**
 * One schema per form, used by the client (field rules) and the server action
 * (the real check). Field names match the form inputs.
 */
const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);
const name = z.string().trim().min(2, "Enter your name").max(120);
const phone = z
  .string()
  .trim()
  .max(40)
  .regex(/^[\d\s()+.-]*$/, "Use digits, spaces and + ( ) - only")
  .optional()
  .or(z.literal(""));
const message = z.string().trim().min(10, "Tell us a little more (10 characters or more)").max(5000);
// Only web links: Zod's url() also accepts schemes like javascript:.
const url = z
  .string()
  .trim()
  .max(500)
  .regex(/^https?:\/\/[^\s]+\.[^\s]+$/i, "Enter a full link starting with https://")
  .optional()
  .or(z.literal(""));

export const contactSchema = z.object({
  name,
  email,
  phone,
  topic: z.enum(["general", "listing", "event", "advertising", "real-estate", "correction"]).default("general"),
  message,
});

export const subscribeSchema = z.object({
  email,
  firstName: z.string().trim().max(80).optional().or(z.literal("")),
  list: z.enum(["newsletter", "events", "real-estate"]).default("newsletter"),
});

export const eventSubmissionSchema = z
  .object({
    title: z.string().trim().min(4, "Give the event a name").max(160),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a start time").optional().or(z.literal("")),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
    venueName: z.string().trim().min(2, "Where is it?").max(160),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    cost: z.string().trim().max(80).optional().or(z.literal("")),
    url,
    description: z.string().trim().min(30, "Describe the event in a few sentences (30 characters or more)").max(5000),
    organizerName: name,
    organizerEmail: email,
    organizerPhone: phone,
  })
  .refine((d) => !d.endTime || !d.startTime || d.endTime > d.startTime, { message: "The end time must be after the start", path: ["endTime"] })
  .refine((d) => d.date >= new Date(Date.now() - 86_400_000).toISOString().slice(0, 10), { message: "Choose today or a future date", path: ["date"] });

export const photoSubmissionSchema = z.object({
  name,
  email,
  caption: z.string().trim().min(3, "Add a short caption").max(300),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  consent: z.literal("on", { message: "Please confirm you took the photo and agree to us posting it" }),
});

export const guideRequestSchema = z.object({
  name,
  email,
  phone,
  guide: z.enum(["buyer", "seller"]),
  timeline: z.enum(["0-3", "3-6", "6-12", "12+", "just-looking"]).default("just-looking"),
});

/** An optional number field: an empty input means "not given", not zero. */
const optionalNumber = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v === "" || v == null ? undefined : v), schema.optional());

export const valuationSchema = z.object({
  name,
  email,
  phone,
  address: z.string().trim().min(5, "Enter the street address").max(200),
  unit: z.string().trim().max(20).optional().or(z.literal("")),
  propertyType: z.enum(["single-family", "condo", "townhouse", "multi-family", "land"]).default("single-family"),
  beds: optionalNumber(z.coerce.number().int("Whole number").min(0).max(20)),
  baths: optionalNumber(z.coerce.number().min(0).max(20)),
  sqft: optionalNumber(z.coerce.number().int("Whole number").min(100, "Check the square footage").max(50000)),
  timeline: z.enum(["0-3", "3-6", "6-12", "12+", "just-curious"]).default("just-curious"),
  notes: z.string().trim().max(3000).optional().or(z.literal("")),
});

export type FormKey = "contact" | "subscribe" | "event" | "photo" | "guide" | "valuation";

/** Images only, up to 10 MB (checked again on the server after re-encoding). */
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
