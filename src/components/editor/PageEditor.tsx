"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import {
  listPageVersions,
  restorePageVersion,
  savePageEdits,
  type VersionRow,
} from "@/app/(site)/_actions/pageEdits";
import type { ImageEdit, TextEdit } from "@/lib/pageEdits";

/**
 * The on-page editor, shown in edit mode. Same controls as the Operations Desk
 * editor: Edit text, Save changes, Discard, Versions, Close. Only words and
 * photos change; formatting, links and layout stay as they are.
 */

type MediaDoc = {
  id: number;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  filename?: string;
  sizes?: Record<string, { url?: string; width?: number; height?: number }>;
};

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const rel = (u: string) =>
  u
    .replace(/^https?:\/\/[^/]+(?=\/api\/media\/)/, "")
    .replace(/(\.[a-z0-9]{2,5})\/$/i, "$1");
const BAR =
  "eyebrow rounded-button border-2 px-3 py-2 text-xs disabled:opacity-40";

const noop = () => () => {};
let pageCache: { key: string; path: string } | null | undefined;
const readPage = () => {
  if (pageCache === undefined) {
    const m = document.querySelector<HTMLElement>("[data-edit-page]");
    pageCache = m?.dataset.editPage
      ? {
          key: m.dataset.editPage,
          path: m.dataset.editPath || location.pathname,
        }
      : null;
  }
  return pageCache;
};

/** Puts a chosen photo into the page (preview) and records it for Save. */
function applySwap(el: HTMLImageElement, src: string, alt: string) {
  el.src = src;
  el.removeAttribute("srcset");
  el.alt = alt;
  el.dataset.editSrc = src;
  el.dataset.editAlt = alt;
}

export function PageEditor() {
  const page = useSyncExternalStore(noop, readPage, () => null);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState("");
  const [versions, setVersions] = useState<{
    current?: VersionRow;
    history: VersionRow[];
  } | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  // A "Change photo" button over each editable photo (some sit under text or links).
  const [spots, setSpots] = useState<
    { el: HTMLImageElement; top: number; left: number }[]
  >([]);
  useEffect(() => {
    if (!editing) return;
    const place = () =>
      setSpots(
        [...document.querySelectorAll<HTMLImageElement>("[data-edit-img]")]
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              el,
              top: r.top + window.scrollY + 8,
              left: r.right + window.scrollX - 8,
              w: r.width,
            };
          })
          .filter((s) => s.w > 40),
      );
    const t = setTimeout(place, 50);
    window.addEventListener("resize", place);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", place);
      setSpots([]);
    };
  }, [editing]);

  useEffect(() => {
    document.body.classList.add("pt-[104px]", "md:pt-[64px]");
    return () => document.body.classList.remove("pt-[104px]", "md:pt-[64px]");
  }, []);

  // Turn editing on and off on every editable piece of the page.
  useEffect(() => {
    const texts = document.querySelectorAll<HTMLElement>("[data-edit-key]");
    const imgs = document.querySelectorAll<HTMLElement>("[data-edit-img]");
    texts.forEach((el) => {
      if (editing) {
        el.setAttribute("contenteditable", "plaintext-only");
        if (el.contentEditable !== "plaintext-only")
          el.setAttribute("contenteditable", "true");
        el.spellcheck = true;
      } else el.removeAttribute("contenteditable");
    });
    document.documentElement.classList.toggle("scl-editing", editing);
    // Open folded answers (FAQs) so their words can be edited.
    if (editing)
      document.querySelectorAll("details").forEach((d) => (d.open = true));
    imgs.forEach((el) => el.classList.toggle("scl-edit-img", editing));

    const onInput = () => setDirty(true);
    const onKey = (e: KeyboardEvent) => {
      // One line of text per piece: Enter finishes the edit instead of adding a line.
      if (
        e.key === "Enter" &&
        (e.target as HTMLElement).closest("[data-edit-key]")
      ) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!editing) return;
      const t = e.target as HTMLElement;
      const img = t.closest<HTMLImageElement>("[data-edit-img]");
      if (img) {
        e.preventDefault();
        setPhoto(img);
        return;
      }
      // Links don't navigate and FAQs don't fold while editing, so their words can be changed.
      if ((t.closest("a") || t.closest("summary")) && !t.closest(".scl-editor"))
        e.preventDefault();
    };
    const onDrop = (e: DragEvent) => editing && e.preventDefault();
    document.addEventListener("input", onInput);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("input", onInput);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("drop", onDrop);
    };
  }, [editing]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const collect = useCallback(() => {
    const texts: Record<string, TextEdit> = {};
    document.querySelectorAll<HTMLElement>("[data-edit-key]").forEach((el) => {
      const from = norm(el.dataset.orig ?? "");
      const to = norm(el.textContent ?? "");
      if (to && to !== from) texts[el.dataset.editKey!] = { from, to };
    });
    const images: Record<string, ImageEdit> = {};
    document.querySelectorAll<HTMLElement>("[data-edit-img]").forEach((el) => {
      const d = el.dataset;
      if (d.editSrc && d.editSrc !== d.editOrig)
        images[d.editImg!] = {
          src: d.editSrc,
          width: Number(d.w) || 1200,
          height: Number(d.h) || 800,
          alt: d.editAlt ?? "",
        };
    });
    return { texts, images };
  }, []);

  const save = async () => {
    if (!page) return;
    setState("Saving…");
    const res = await savePageEdits(page.key, page.path, collect());
    if (res.ok) {
      setDirty(false);
      const n = res.data?.changes ?? 0;
      setState(
        `Saved · ${n} change${n === 1 ? "" : "s"} on this page · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
      );
      if (showVersions) loadVersions();
    } else setState(res.message);
  };

  const discard = () => {
    setDirty(false);
    location.reload();
  };

  const loadVersions = async () => {
    if (!page) return;
    const r = await listPageVersions(page.key);
    setVersions(r.ok ? (r.data ?? { history: [] }) : { history: [] });
  };

  const restore = async (id: string) => {
    if (!page) return;
    if (
      dirty &&
      !confirm("Restoring drops the changes you haven't saved. Continue?")
    )
      return;
    setState("Restoring…");
    const r = await restorePageVersion(page.key, page.path, id);
    if (r.ok) {
      setDirty(false);
      location.reload();
    } else setState(r.message);
  };

  const close = () => {
    if (dirty && !confirm("You have unsaved changes. Close without saving?"))
      return;
    setDirty(false);
    location.href = `/edit/?exit=1&path=${encodeURIComponent(page?.path || location.pathname)}`;
  };

  const when = (iso: string) =>
    new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div
      className="scl-editor fixed inset-x-0 top-0 z-[60] border-b-2 border-teal-700 bg-white shadow-card"
      role="region"
      aria-label="Page editor"
    >
      <div className="container-site flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-xs text-teal-700">
            {page ? "Editing page" : "This page can't be edited here"}
          </p>
          <p
            className="truncate text-small text-ink-500"
            role="status"
            aria-live="polite"
          >
            {page
              ? state ||
                (editing
                  ? "Click any text to change it. Click a photo to swap it. Only words and photos change: formatting, links and layout stay as they are. Press Save when you're done."
                  : "Press Edit text to start.")
              : "Posts, events, places and neighborhoods are edited in the admin."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {page && (
            <>
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                aria-pressed={editing}
                className={`${BAR} ${editing ? "border-teal-700 bg-teal-700 text-white" : "border-teal-700 text-teal-700"}`}
              >
                Edit text
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!dirty}
                className={`${BAR} border-teal-700 bg-teal-700 text-white`}
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={discard}
                disabled={!dirty}
                className={`${BAR} border-ink-500 text-ink-900`}
              >
                Discard
              </button>
              <button
                type="button"
                aria-expanded={showVersions}
                onClick={() => {
                  setShowVersions(!showVersions);
                  if (!showVersions) loadVersions();
                }}
                className={`${BAR} border-ink-500 text-ink-900`}
              >
                Versions
              </button>
            </>
          )}
          {!page && (
            <Link
              href="/admin"
              className={`${BAR} border-teal-700 text-teal-700 no-underline`}
            >
              Open the admin
            </Link>
          )}
          <button
            type="button"
            onClick={close}
            className={`${BAR} border-ink-500 text-ink-900`}
          >
            Close
          </button>
        </div>
      </div>

      {showVersions && page && (
        <div className="container-site border-t border-teal-50 py-3 text-small">
          {!versions ? (
            <p>Loading versions…</p>
          ) : (
            <>
              <p className="font-bold">Versions (last 10 kept)</p>
              <ol className="mt-2 grid gap-1">
                <li>
                  {versions.current
                    ? `Current: saved ${when(versions.current.updatedAt)} by ${versions.current.by}, ${versions.current.changes} changes`
                    : "Current: the original page"}
                </li>
                {versions.history.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-2">
                    {when(h.updatedAt)} by {h.by}, {h.changes} changes
                    <button
                      type="button"
                      onClick={() => restore(h.id)}
                      className="rounded-button border border-teal-700 px-2 py-0.5 text-xs text-teal-700"
                    >
                      Restore
                    </button>
                  </li>
                ))}
                {versions.current && (
                  <li className="flex flex-wrap items-center gap-2">
                    Original page
                    <button
                      type="button"
                      onClick={() => restore("__original")}
                      className="rounded-button border border-teal-700 px-2 py-0.5 text-xs text-teal-700"
                    >
                      Restore original
                    </button>
                  </li>
                )}
              </ol>
            </>
          )}
        </div>
      )}

      {editing &&
        createPortal(
          spots.map((sp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPhoto(sp.el)}
              style={{
                position: "absolute",
                top: sp.top,
                left: sp.left,
                transform: "translateX(-100%)",
              }}
              className="eyebrow z-[55] whitespace-nowrap rounded-button bg-coral-700 px-3 py-2 text-xs text-white shadow-card"
            >
              Change photo
            </button>
          )),
          document.body,
        )}

      {photo && (
        <PhotoPanel
          img={photo}
          onClose={() => setPhoto(null)}
          onPick={(src, alt) => {
            applySwap(photo, src, alt);
            setDirty(true);
            setPhoto(null);
          }}
        />
      )}
    </div>
  );
}

/** Swap a photo: from the media library or an upload cropped to the spot's size; alt text required. */
function PhotoPanel({
  img,
  onPick,
  onClose,
}: {
  img: HTMLImageElement;
  onPick: (src: string, alt: string) => void;
  onClose: () => void;
}) {
  const w = Number(img.dataset.w) || img.naturalWidth || 1200;
  const h = Number(img.dataset.h) || img.naturalHeight || 800;
  const [alt, setAlt] = useState(img.dataset.editAlt || img.alt || "");
  const [q, setQ] = useState("");
  const [lib, setLib] = useState<MediaDoc[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const altRef = useRef<HTMLInputElement>(null);

  useEffect(() => altRef.current?.focus(), []);
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const params = new URLSearchParams({
        limit: "24",
        sort: "-createdAt",
        depth: "0",
        "where[mimeType][contains]": "image",
      });
      if (q.trim()) {
        params.set("where[or][0][alt][like]", q.trim());
        params.set("where[or][1][filename][like]", q.trim());
      }
      try {
        const r = await fetch(`/api/media?${params}`, {
          credentials: "include",
          signal: ctrl.signal,
        });
        if (r.ok) setLib(((await r.json()) as { docs: MediaDoc[] }).docs);
      } catch {
        /* aborted or offline */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  // A library photo: the resized copy that fits the spot (card up to 768px wide, else the large one).
  const pickSrc = (m: MediaDoc) =>
    rel((w <= 768 ? m.sizes?.card?.url : m.sizes?.hero?.url) || m.url);

  const upload = async (file: File) => {
    if (!alt.trim()) {
      setStatus("Add alt text first: describe the photo in a few words.");
      altRef.current?.focus();
      return;
    }
    setStatus("Cropping and uploading…");
    try {
      // Crop to the spot's shape (cover), so the layout stays the same.
      const bmp = await createImageBitmap(file);
      const scale = Math.max(w / bmp.width, h / bmp.height);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      const sw = w / scale;
      const sh = h / scale;
      ctx.drawImage(
        bmp,
        (bmp.width - sw) / 2,
        (bmp.height - sh) / 2,
        sw,
        sh,
        0,
        0,
        w,
        h,
      );
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob(
          (b) => (b ? res(b) : rej(new Error("crop"))),
          "image/jpeg",
          0.88,
        ),
      );
      const name = `${
        file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-z0-9-]+/gi, "-")
          .slice(0, 60) || "photo"
      }-${w}x${h}.jpg`;
      const fd = new FormData();
      fd.append("file", new File([blob], name, { type: "image/jpeg" }));
      fd.append("_payload", JSON.stringify({ alt: alt.trim() }));
      const r = await fetch("/api/media", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!r.ok) throw new Error(String(r.status));
      const { doc } = (await r.json()) as { doc: MediaDoc };
      onPick(rel(doc.url), alt.trim());
    } catch {
      setStatus(
        "Couldn't upload. Check that you're signed in and the file is a JPG, PNG or WebP.",
      );
    }
  };

  return (
    <div
      className="container-site border-t border-teal-50 py-3"
      role="dialog"
      aria-label="Swap photo"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="grid content-start gap-2 text-small">
          <p className="font-bold">
            Photo spot · {w}×{h}
          </p>
          <p className="text-xs text-ink-500">
            Uploads are cropped to {w}×{h} so the layout stays the same.
          </p>
          <label htmlFor="scl-alt" className="font-bold">
            Alt text (describes the photo for Google and screen readers)
          </label>
          <input
            id="scl-alt"
            ref={altRef}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            className="rounded-button border border-ink-500/40 px-3 py-2"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="eyebrow cursor-pointer rounded-button border-2 border-teal-700 px-3 py-2 text-xs text-teal-700">
              Upload your own
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) =>
                  e.target.files?.[0] && upload(e.target.files[0])
                }
              />
            </label>
            <button
              type="button"
              disabled={!chosen || !alt.trim()}
              onClick={() => chosen && onPick(chosen, alt.trim())}
              className="eyebrow rounded-button border-2 border-teal-700 bg-teal-700 px-3 py-2 text-xs text-white disabled:opacity-40"
            >
              Put photo in
            </button>
            <button
              type="button"
              onClick={onClose}
              className="eyebrow rounded-button border-2 border-ink-500 px-3 py-2 text-xs"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs" role="status" aria-live="polite">
            {status}
          </p>
        </div>
        <div>
          <label htmlFor="scl-q" className="text-small font-bold">
            Or pick from the media library
          </label>
          <input
            id="scl-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search photos"
            className="mt-1 w-full rounded-button border border-ink-500/40 px-3 py-2 text-small"
          />
          <ul className="mt-2 grid max-h-56 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
            {lib.map((m) => {
              const src = pickSrc(m);
              const thumb = rel(m.sizes?.thumbnail?.url || m.url);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setChosen(src);
                      if (!alt.trim() && m.alt) setAlt(m.alt);
                    }}
                    aria-pressed={chosen === src}
                    className={`block w-full overflow-hidden rounded ${chosen === src ? "ring-4 ring-teal-700" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- library thumbnails in the editor */}
                    <img
                      src={thumb}
                      alt={m.alt || m.filename || ""}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
