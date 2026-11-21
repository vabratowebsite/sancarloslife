import { describe, expect, it } from "vitest";

import {
  contactSchema,
  eventSubmissionSchema,
  guideRequestSchema,
  photoSubmissionSchema,
  subscribeSchema,
  valuationSchema,
} from "@/lib/forms/schemas";

const future = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

describe("form schemas", () => {
  it("contact: rejects empty and invalid input, accepts a real message", () => {
    expect(contactSchema.safeParse({}).success).toBe(false);
    expect(contactSchema.safeParse({ name: "A", email: "x", message: "hi" }).success).toBe(false);
    const ok = contactSchema.safeParse({ name: "Ana Lopez", email: " Ana@Example.com ", message: "Is the farmers market on this week?" });
    expect(ok.success && ok.data.email).toBe("ana@example.com");
  });

  it("contact: phone allows only phone characters", () => {
    expect(contactSchema.safeParse({ name: "Ana", email: "a@b.co", message: "1234567890ab", phone: "<script>" }).success).toBe(false);
  });

  it("subscribe: email required, list defaults to the newsletter", () => {
    expect(subscribeSchema.safeParse({ email: "" }).success).toBe(false);
    const r = subscribeSchema.safeParse({ email: "a@b.co" });
    expect(r.success && r.data.list).toBe("newsletter");
  });

  it("event: needs a future date, end after start, and a real description", () => {
    const base = { title: "Picnic", date: future, venueName: "Burton Park", description: "A picnic for neighbors with games and music.", organizerName: "Ana", organizerEmail: "a@b.co" };
    expect(eventSubmissionSchema.safeParse(base).success).toBe(true);
    expect(eventSubmissionSchema.safeParse({ ...base, date: "2020-01-01" }).success).toBe(false);
    expect(eventSubmissionSchema.safeParse({ ...base, startTime: "14:00", endTime: "13:00" }).success).toBe(false);
    expect(eventSubmissionSchema.safeParse({ ...base, description: "short" }).success).toBe(false);
    expect(eventSubmissionSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
  });

  it("photo: consent must be ticked", () => {
    const base = { name: "Ana Lopez", email: "a@b.co", caption: "Sunset" };
    expect(photoSubmissionSchema.safeParse(base).success).toBe(false);
    expect(photoSubmissionSchema.safeParse({ ...base, consent: "on" }).success).toBe(true);
  });

  it("guide: only buyer or seller", () => {
    expect(guideRequestSchema.safeParse({ name: "Ana", email: "a@b.co", guide: "investor" }).success).toBe(false);
    expect(guideRequestSchema.safeParse({ name: "Ana", email: "a@b.co", guide: "seller" }).success).toBe(true);
  });
});

describe("valuationSchema", () => {
  const base = { name: "Pat Lee", email: "pat@example.com", phone: "", address: "123 Elm Street", unit: "", propertyType: "condo", timeline: "0-3", notes: "" };
  it("treats empty number inputs as not given", () => {
    const r = valuationSchema.safeParse({ ...base, beds: "", baths: "", sqft: "" });
    expect(r.success).toBe(true);
    expect(r.success && r.data.sqft).toBeUndefined();
  });
  it("coerces numbers and rejects nonsense", () => {
    expect(valuationSchema.safeParse({ ...base, beds: "3", baths: "2.5", sqft: "1450" }).success).toBe(true);
    expect(valuationSchema.safeParse({ ...base, sqft: "12" }).success).toBe(false);
    expect(valuationSchema.safeParse({ ...base, beds: "2.5" }).success).toBe(false);
  });
});
