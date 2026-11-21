"use client";

import Link from "next/link";

import { requestGuide, submitContact, submitEvent, submitPhoto, submitSubscribe } from "@/app/(site)/_actions/forms";

import { Checkbox, Field, FileField, Form, Select, TextArea } from "./Form";

export function ContactForm() {
  return (
    <Form action={submitContact} submitLabel="Send message">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Your name" required autoComplete="name" />
        <Field name="email" label="Email" type="email" required autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="phone" label="Phone" type="tel" autoComplete="tel" />
        <Select
          name="topic"
          label="What is it about?"
          required
          options={[
            ["general", "A question or idea"],
            ["listing", "Add or update a business listing"],
            ["event", "An event"],
            ["correction", "Something on the site is wrong"],
            ["advertising", "Sponsorship or advertising"],
            ["real-estate", "Buying or selling a home"],
          ]}
        />
      </div>
      <TextArea name="message" label="Message" required rows={6} />
    </Form>
  );
}

export function SubscribeForm({ list = "newsletter", compact = false }: { list?: "newsletter" | "events" | "real-estate"; compact?: boolean }) {
  return (
    <Form action={submitSubscribe} submitLabel="Subscribe">
      <input type="hidden" name="list" value={list} />
      <div className={compact ? "grid gap-3" : "grid gap-4 sm:grid-cols-2"}>
        {!compact && <Field name="firstName" label="First name" autoComplete="given-name" />}
        <Field name="email" label="Email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </div>
      <p className="text-xs text-ink-500">
        One email a week. Unsubscribe any time. See our <Link href="/privacy-policy/">privacy policy</Link>.
      </p>
    </Form>
  );
}

export function EventSubmitForm() {
  return (
    <Form action={submitEvent} submitLabel="Submit event">
      <Field name="title" label="Event name" required />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="date" label="Date" type="date" required />
        <Field name="startTime" label="Starts" type="time" hint="Leave empty for all day" />
        <Field name="endTime" label="Ends" type="time" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="venueName" label="Place" required hint="e.g. Burton Park" />
        <Field name="address" label="Address" autoComplete="street-address" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="cost" label="Cost" hint='e.g. "Free" or "$15"' />
        <Field name="url" label="Event or ticket link" type="url" placeholder="https://" />
      </div>
      <TextArea name="description" label="Description" required rows={6} hint="What happens, who it's for, anything to bring." />
      <fieldset className="grid gap-4 rounded-card border border-teal-50 p-4">
        <legend className="eyebrow px-2 text-teal-700">Your contact details (not published)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="organizerName" label="Name" required autoComplete="name" />
          <Field name="organizerEmail" label="Email" type="email" required autoComplete="email" />
          <Field name="organizerPhone" label="Phone" type="tel" autoComplete="tel" />
        </div>
      </fieldset>
    </Form>
  );
}

export function PhotoSubmitForm() {
  return (
    <Form action={submitPhoto} submitLabel="Send photo" encType="multipart/form-data">
      <FileField name="photo" label="Photo" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hint="JPG, PNG, WebP or HEIC, up to 10 MB" />
      <Field name="caption" label="Caption" required hint='e.g. "Sunset over Big Canyon Park"' />
      <Field name="location" label="Where in San Carlos" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Your name (for the photo credit)" required autoComplete="name" />
        <Field name="email" label="Email" type="email" required autoComplete="email" />
      </div>
      <Checkbox name="consent" label="I took this photo in San Carlos and agree to San Carlos Life posting it on the website and social media with credit to me." />
    </Form>
  );
}

export function GuideRequestForm({ guide }: { guide: "buyer" | "seller" }) {
  return (
    <Form action={requestGuide} submitLabel={guide === "buyer" ? "Send me the buyer's guide" : "Send me the seller's guide"}>
      <input type="hidden" name="guide" value={guide} />
      <Field name="name" label="Name" required autoComplete="name" />
      <Field name="email" label="Email" type="email" required autoComplete="email" />
      <Field name="phone" label="Phone" type="tel" autoComplete="tel" />
      <Select
        name="timeline"
        label={guide === "buyer" ? "When are you hoping to buy?" : "When are you thinking of selling?"}
        options={[
          ["just-looking", "Just exploring"],
          ["0-3", "Within 3 months"],
          ["3-6", "3 to 6 months"],
          ["6-12", "6 to 12 months"],
          ["12+", "More than a year"],
        ]}
      />
    </Form>
  );
}
