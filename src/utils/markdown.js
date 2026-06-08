import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: false
});

const sanitizeOptions = {
  ALLOWED_TAGS: ["a", "br", "code", "em", "li", "ol", "p", "strong", "ul"],
  ALLOWED_ATTR: ["href", "title"]
};

export function renderMarkdown(value = "") {
  const html = markdown.render(String(value || ""));
  return DOMPurify.sanitize(html, sanitizeOptions);
}
