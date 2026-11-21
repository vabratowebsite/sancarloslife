import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import type { Page } from "@playwright/test";

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

/** Serious and critical axe violations on the current page (WCAG 2.2 AA rules). */
export async function seriousViolations(page: Page) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    // @ts-expect-error axe is injected above
    const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"], resultTypes: ["violations"] });
    return (r.violations as { id: string; impact: string; nodes: { target: string[] }[] }[])
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")}`);
  });
}
