import sanitizeHtml from "sanitize-html";

const WORDS_PER_MINUTE = 220;

/**
 * Whitelist matching what the TipTap editor can produce. Anything else
 * (scripts, event handlers, inline styles, iframes…) is stripped server-side,
 * so stored HTML is safe to render with dangerouslySetInnerHTML.
 */
export function sanitizeContent(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "del",
      "blockquote", "ul", "ol", "li", "a", "code", "pre", "span", "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      ol: ["start"],
      code: ["class"],
      span: ["class"],
    },
    allowedClasses: {
      code: ["language-*"],
      span: ["hljs-*"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      h1: "h2",
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }),
    },
    // Relative image URLs (our own /uploads/...) are allowed via the filter below.
    exclusiveFilter: (frame) =>
      frame.tag === "img" && !/^(https?:\/\/|\/uploads\/)/.test(frame.attribs.src ?? ""),
  });
}

export function htmlToText(html: string) {
  return sanitizeHtml(html.replace(/<\/(p|h[1-6]|li|blockquote|pre)>/g, "$& "), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingTime(html: string) {
  const words = htmlToText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function makeExcerpt(html: string, max = 180) {
  const text = htmlToText(html);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:—-]+$/, "")}…`;
}
