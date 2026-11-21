import "server-only";

/**
 * The connector's sign-in pages: plain HTML from the route handlers (no site
 * layout, no scripts). Their CSP allows the form to post here and to be
 * redirected only to the app's own return address.
 */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const STYLE = `
  :root { color-scheme: light; }
  body { margin: 0; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; background: #f6f3ee; color: #1f2a2e; }
  main { max-width: 460px; margin: 10vh auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
  h1 { font-size: 22px; margin: 0 0 12px; }
  p, li { color: #3d4a4f; }
  ul { padding-left: 20px; }
  .app { font-weight: 700; color: #1f2a2e; }
  .who { font-size: 14px; }
  .row { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
  button { font: inherit; font-weight: 700; padding: 12px 20px; border-radius: 8px; border: 2px solid #0f5e63; cursor: pointer; min-height: 44px; }
  .allow { background: #0f5e63; color: #fff; }
  .deny { background: #fff; color: #0f5e63; }
  button:focus-visible { outline: 3px solid #1f2a2e; outline-offset: 2px; }
  code { font-size: 13px; word-break: break-all; }
`;

function page(title: string, body: string, formTarget?: string) {
  const formAction = formTarget ? `'self' ${formTarget}` : "'self'";
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} · San Carlos Life</title><style>${STYLE}</style></head><body><main>${body}</main></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; form-action ${formAction}; frame-ancestors 'none'; base-uri 'none'`,
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}

export function errorPage(message: string, status = 400) {
  const res = page("Can't connect", `<h1>Can&rsquo;t connect this app</h1><p>${esc(message)}</p>`);
  return new Response(res.body, { status, headers: res.headers });
}

export function consentPage(opts: { appName: string; redirectUri: string; userEmail: string; hidden: Record<string, string> }) {
  const target = new URL(opts.redirectUri).origin;
  const inputs = Object.entries(opts.hidden)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join("");
  return page(
    "Allow access",
    `<h1>Allow <span class="app">${esc(opts.appName)}</span> to use the San Carlos Life website?</h1>
     <p>It will be able to, as you:</p>
     <ul>
       <li>read the site&rsquo;s posts, events, places, pages and AI prompts,</li>
       <li>send drafts to the Approval queue and revise drafts,</li>
       <li>record research runs in the desk&rsquo;s run log.</li>
     </ul>
     <p>It can&rsquo;t publish anything, approve drafts or change settings. You can remove it any time under Operations Desk &rarr; Connected apps.</p>
     <p class="who">Signed in as <strong>${esc(opts.userEmail)}</strong>. The app will return to <code>${esc(target)}</code>.</p>
     <form method="post" action="/oauth/authorize">${inputs}
       <div class="row">
         <button class="allow" type="submit" name="decision" value="allow">Allow</button>
         <button class="deny" type="submit" name="decision" value="deny">Don&rsquo;t allow</button>
       </div>
     </form>`,
    target,
  );
}
