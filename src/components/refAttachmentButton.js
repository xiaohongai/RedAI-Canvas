export const PROMPT_ATTACHMENT_BUTTON_TOOLTIP = "添加参考";
function escapeHtmlAttr(v0) {
  return String(v0)
    ["replace"](/&/g, "&amp;")
    ["replace"](/"/g, "&quot;")
    ["replace"](/</g, "&lt;")
    ["replace"](/>/g, "&gt;");
}
export function createPromptAttachmentButtonHTML(v1 = {}) {
  const v2 = escapeHtmlAttr(v1["tooltip"] || PROMPT_ATTACHMENT_BUTTON_TOOLTIP),
    v3 = v1["stroke"] || "var(--text-primary)",
    v4 = v1["fill"] || "var(--white-05)",
    v5 = v1["circleFill"] || v3;
  return (
    '<div class="prompt-attachment-btn" title="' +
    v2 +
    "\x22\x20aria-label=\x22" +
    v2 +
    '">\n            <span class="btn-icon">\n                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="' +
    v3 +
    '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">\n                    <path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" fill="' +
    v4 +
    '" />\n                    <circle cx="20" cy="20" r="2.5" fill="' +
    v5 +
    '" />\n                    <path d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3" />\n                </svg>\n            </span>\n        </div>'
  );
}
