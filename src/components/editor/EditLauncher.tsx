"use client";

import { useSyncExternalStore } from "react";

/**
 * "Edit this page" for people who have used the editor before (the scl-editor
 * hint cookie, set when edit mode is turned on). Signing in is still checked
 * by /edit/. Shown only on pages the editor can change.
 */
const noop = () => () => {};
const readHref = () => {
  if (!document.cookie.split("; ").includes("scl-editor=1")) return null;
  const m = document.querySelector<HTMLElement>("[data-edit-page]");
  return m ? `/edit/?path=${encodeURIComponent(m.dataset.editPath || location.pathname)}` : null;
};

export function EditLauncher() {
  // Read on the client; null on the server so nothing flashes.
  const href = useSyncExternalStore(noop, readHref, () => null);
  if (!href) return null;
  return (
    <a
      href={href}
      className="eyebrow fixed bottom-4 left-4 z-50 rounded-button bg-ink-900 px-4 py-3 text-xs text-white no-underline shadow-card hover:bg-teal-700"
    >
      Edit this page
    </a>
  );
}
