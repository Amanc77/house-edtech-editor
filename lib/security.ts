import { createHash } from "crypto";
import DOMPurify from "isomorphic-dompurify";
import sanitizeHtml from "sanitize-html";
import { MAX_CONTENT_LENGTH, MAX_SYNC_PAYLOAD_BYTES } from "@/constants";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "span",
  "div",
  "mark",
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  span: ["style", "class"],
  div: ["style", "class"],
  p: ["style", "class"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  code: ["class"],
  pre: ["class"],
};

export function sanitizeContent(html: string): string {
  const purified = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: Object.values(ALLOWED_ATTRIBUTES).flat(),
    ALLOW_DATA_ATTR: false,
  });

  return sanitizeHtml(purified, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
  });
}

export function sanitizePlainText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

export function sanitizeTitle(title: string): string {
  return sanitizePlainText(title).slice(0, 200);
}

export function validatePayloadSize(
  payload: unknown,
  maxBytes: number = MAX_SYNC_PAYLOAD_BYTES
): { valid: boolean; size: number; error?: string } {
  const serialized = JSON.stringify(payload);
  const size = Buffer.byteLength(serialized, "utf8");

  if (size > maxBytes) {
    return {
      valid: false,
      size,
      error: `Payload size ${size} bytes exceeds maximum of ${maxBytes} bytes`,
    };
  }

  return { valid: true, size };
}

export function validateContentLength(content: string): {
  valid: boolean;
  error?: string;
} {
  if (content.length > MAX_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `Content length ${content.length} exceeds maximum of ${MAX_CONTENT_LENGTH} characters`,
    };
  }
  return { valid: true };
}

export function computeChecksum(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 32);
}

export function sanitizeMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const safeKey = sanitizePlainText(key).slice(0, 100);
    if (!safeKey) continue;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[safeKey] =
        typeof value === "string" ? sanitizePlainText(value).slice(0, 1000) : value;
    }
  }

  return sanitized;
}

export function stripHtml(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
}
