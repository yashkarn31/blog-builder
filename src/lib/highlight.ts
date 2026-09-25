import "server-only";
import hljs from "highlight.js/lib/common";

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, "&");

/**
 * The editor highlights code live, but getHTML() stores plain code. Highlight
 * at render time so published posts get the same colours (hljs escapes output).
 */
export function highlightCodeBlocks(html: string) {
  return html.replace(
    /<pre><code(?: class="language-([\w+-]+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang: string | undefined, code: string) => {
      const text = decode(code);
      const result =
        lang && hljs.getLanguage(lang) ? hljs.highlight(text, { language: lang }) : hljs.highlightAuto(text);
      const cls = `hljs${lang ? ` language-${lang}` : ""}`;
      return `<pre><code class="${cls}">${result.value}</code></pre>`;
    },
  );
}
