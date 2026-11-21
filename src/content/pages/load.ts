import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { sanitize } from "@/lib/sanitize";

const DIR = path.join(process.cwd(), "src/content/pages");

/** The body HTML of a code page, sanitized again on the way out (cheap, and the files are hand-edited). */
export async function loadPageHtml(slug: string): Promise<string | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    return sanitize(await readFile(path.join(DIR, `${slug}.html`), "utf8"));
  } catch {
    return null;
  }
}
