"use client";

import { useState, useTransition } from "react";

import type { Suggestion } from "@/lib/media/suggest";

import { generateIllustrationAction, suggestPhotosAction, pickPhotoAction } from "./actions";

type Found = { fromSources: Suggestion[]; stock: Suggestion[]; notes: string[]; checked: string[] };

/**
 * "Suggest photos" on an approval-queue item: finds candidates (source pages, Pexels) on
 * request, lets the editor pick one with alt text, or generate an AI illustration for generic
 * topics. Picking only sets the photo on a new draft version; approving still publishes.
 */
export function SuggestPhotos({ collection, id, title, aiConnections }: { collection: string; id: string; title: string; aiConnections: { id: string; name: string }[] }) {
  const [found, setFound] = useState<Found | null>(null);
  const [message, setMessage] = useState("");
  const [alts, setAlts] = useState<Record<string, string>>({});
  const [topic, setTopic] = useState(title);
  const [aiAlt, setAiAlt] = useState("");
  const [busy, start] = useTransition();
  const aiAllowed = (collection === "posts" || collection === "desk-pages") && aiConnections.length > 0;

  const find = () =>
    start(async () => {
      setMessage("Looking for photos…");
      const r = await suggestPhotosAction(collection, id);
      if (!r.ok) return setMessage(r.message);
      setFound(r.data);
      setMessage(r.data.fromSources.length + r.data.stock.length ? "" : "No photos found on the source pages.");
    });

  const pick = (s: Suggestion) =>
    start(async () => {
      setMessage("Adding the photo…");
      const r = await pickPhotoAction(collection, id, { url: s.url, alt: alts[s.url] ?? s.alt, credit: s.credit, link: s.link, kind: s.kind });
      setMessage(r.ok ? `Photo set on the draft${r.data.passesFormatCheck ? "" : " (the draft still has things to fix)"}. Reload to see it in the queue.` : r.message);
    });

  const generate = (connection: string) =>
    start(async () => {
      setMessage("Generating an illustration (this can take a minute and is billed by the AI provider)…");
      const r = await generateIllustrationAction(collection, id, { topic, alt: aiAlt, connection });
      setMessage(r.ok ? "Illustration set on the draft. Reload to see it in the queue." : r.message);
    });

  const card = (s: Suggestion) => (
    <li key={s.url} style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: 8, display: "grid", gap: 6, alignContent: "start" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.thumb} alt="" referrerPolicy="no-referrer" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: 4, background: "var(--theme-elevation-100)" }} />
      <small>
        {s.credit}
        {s.link ? (
          <>
            {" · "}
            <a href={s.link} target="_blank" rel="noopener noreferrer">
              {s.kind === "pexels" ? "on Pexels" : "source page"}
            </a>
          </>
        ) : null}
      </small>
      {s.note ? <small style={{ color: "var(--theme-warning-650, inherit)" }}>{s.note}</small> : null}
      <label style={{ fontSize: 12 }}>
        Alt text
        <input
          value={alts[s.url] ?? s.alt}
          onChange={(e) => setAlts({ ...alts, [s.url]: e.target.value })}
          style={{ display: "block", width: "100%", padding: 4 }}
          maxLength={200}
        />
      </label>
      <button type="button" disabled={busy} onClick={() => pick(s)} className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }}>
        Use this photo
      </button>
    </li>
  );

  return (
    <details style={{ marginTop: 8 }}>
      <summary style={{ cursor: "pointer" }}>Suggest photos</summary>
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        <button type="button" disabled={busy} onClick={find} className="btn btn--style-secondary btn--size-small" style={{ margin: 0, justifySelf: "start" }}>
          {found ? "Look again" : "Find photos"}
        </button>
        {message ? (
          <p role="status" style={{ margin: 0 }}>
            {message}
          </p>
        ) : null}
        {found ? (
          <>
            <b>From the source pages ({found.fromSources.length})</b>
            {found.checked.length ? <small>Checked: {found.checked.join(", ")}</small> : <small>No source pages: add the business website or sources to the item first.</small>}
            <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>{found.fromSources.map(card)}</ul>
            <b>Stock photos from Pexels ({found.stock.length})</b>
            <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>{found.stock.map(card)}</ul>
            {found.notes.map((n) => (
              <small key={n}>{n}</small>
            ))}
          </>
        ) : null}
        {aiAllowed ? (
          <fieldset style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: 8 }}>
            <legend>AI illustration (generic topics only)</legend>
            <p style={{ margin: "0 0 6px" }}>
              For articles without a real photo. Never for real people, places or events. Labelled &ldquo;AI illustration&rdquo;. Each one is billed by the AI provider.
            </p>
            <label>
              Topic
              <input value={topic} onChange={(e) => setTopic(e.target.value)} style={{ display: "block", width: "100%", padding: 4 }} maxLength={300} />
            </label>
            <label>
              Alt text
              <input value={aiAlt} onChange={(e) => setAiAlt(e.target.value)} style={{ display: "block", width: "100%", padding: 4 }} maxLength={200} placeholder="What the illustration shows" />
            </label>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              {aiConnections.map((c) => (
                <button key={c.id} type="button" disabled={busy} onClick={() => generate(c.id)} className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }}>
                  Generate with {c.name}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>
    </details>
  );
}
