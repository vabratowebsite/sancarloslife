import sanitizeHtml from "sanitize-html";

/** Hosts whose iframes may appear in posts (video and maps). */
const IFRAME_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "www.google.com",
  "maps.google.com",
  "calendar.google.com",
  "docs.google.com",
  "www.facebook.com",
  "www.instagram.com",
  "www.canva.com",
];

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "sup", "sub", "small",
    "a", "ul", "ol", "li", "blockquote", "figure", "figcaption", "img", "picture", "source",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
    "div", "span", "iframe", "video", "audio", "code", "pre", "mark", "abbr", "cite", "dl", "dt", "dd",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel", "id"],
    img: ["src", "srcset", "sizes", "alt", "title", "width", "height", "loading"],
    source: ["src", "srcset", "type", "media"],
    iframe: ["src", "title", "width", "height", "allow", "allowfullscreen", "loading", "frameborder"],
    video: ["src", "controls", "poster", "width", "height", "preload"],
    audio: ["src", "controls", "preload"],
    table: ["tabindex"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    "*": ["id", "class"],
  },
  allowedClasses: {
    // Only our own styling hooks survive; Divi/WordPress classes are dropped.
    "*": ["align-center", "align-left", "align-right", "lead", "note", "wp-caption"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedIframeHostnames: IFRAME_HOSTS,
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:\/\//.test(attribs.href ?? "") && !/^https?:\/\/(www\.)?sancarloslife\.com/.test(attribs.href ?? "");
      return {
        tagName,
        attribs: external ? { ...attribs, rel: "noopener noreferrer", target: "_blank" } : attribs,
      };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: attribs.loading ?? "lazy" } }),
    iframe: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    // Wide tables scroll sideways; tabindex lets keyboard users scroll them too.
    table: (tagName, attribs) => ({ tagName, attribs: { ...attribs, tabindex: "0" } }),
  },
};

/** Removes elements with nothing inside (page-builder leftovers), innermost first. */
function dropEmpty(html: string): string {
  let out = html;
  for (let i = 0; i < 8; i++) {
    const next = out.replace(/<(span|div|p|h[1-6]|strong|em|b|i|li|figure)(?:\s[^>]*)?>(?:\s|&nbsp;|\u00a0|<br\s*\/?>)*<\/\1>/gi, "");
    if (next === out) break;
    out = next;
  }
  return out;
}

/** Sanitize editor or migrated HTML before rendering it. */
export function sanitize(html: string): string {
  return dropEmpty(sanitizeHtml(html, options));
}

/**
 * Migration-time cleanup of WordPress/Divi output: unwraps builder wrappers,
 * removes leftover shortcodes and inline styles, then sanitizes.
 */
export function cleanWordPressHtml(html: string): string {
  let out = html
    // Icon-font glyphs (Divi/Font Awesome use Unicode private-use characters).
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/&#x(?:e|f)[0-9a-f]{3};/gi, "")
    // Leftover shortcodes like [et_pb_text] or [caption id="..."] (keep the caption text).
    .replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/g, "$1")
    .replace(/\[\/?[a-z_][\w-]*(?:\s[^\]]*)?\]/gi, "")
    // Text alignment is the one inline style worth keeping, as a class.
    .replace(/style="[^"]*text-align:\s*center[^"]*"/gi, 'class="align-center"')
    .replace(/style="[^"]*text-align:\s*right[^"]*"/gi, 'class="align-right"');
  out = dropEmpty(
    sanitizeHtml(out, {
      ...options,
      nonTextTags: ["style", "script", "textarea", "option", "noscript"],
      // Widgets the new site rebuilds: iHomefinder listings, WP Google Maps,
      // Gravity Forms, Divi maps/forms/sliders and MailOptin popups.
      exclusiveFilter: (frame) =>
        /(^|\s)(ihf-|ihf_|wpgmza|gform_|et_pb_map|et_pb_contact_form|et_pb_signup|mo-optin|mailoptin|et_pb_slider)/.test(
          frame.attribs?.class ?? "",
        ) || /^(ihf|wpgmza|gform)/.test(frame.attribs?.id ?? ""),
      allowedClasses: undefined,
      allowedAttributes: { ...options.allowedAttributes, "*": ["id", "class"] },
    }),
  );
  // Class attributes were kept only so the filter above could see them; drop all but ours.
  out = sanitizeHtml(out, options);
  // Unwrap class-less divs and spans (builder wrappers); their content stays.
  out = out.replace(/<\/?div>/g, "").replace(/<span>([\s\S]*?)<\/span>/g, "$1");
  return out.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * HTML of pages rebuilt from the WordPress layouts (src/content/divi). Same rules as
 * posts, plus what those layouts need to look like the live site: h1, details/summary
 * (FAQ blocks), and only two inline styles, text alignment and a plain color.
 */
const layoutOptions: sanitizeHtml.IOptions = {
  ...options,
  allowedTags: [...(options.allowedTags as string[]), "h1", "details", "summary"],
  allowedAttributes: { ...(options.allowedAttributes as Record<string, string[]>), "*": ["id", "class", "style"] },
  allowedStyles: {
    "*": {
      "text-align": [/^(left|right|center|justify)$/],
      color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
    },
  },
  allowedClasses: { "*": [...((options.allowedClasses as Record<string, string[]>)["*"] ?? []), "blue", "navy", "teal"] },
};

export function sanitizeLayout(html: string): string {
  return sanitizeHtml(html, layoutOptions);
}
