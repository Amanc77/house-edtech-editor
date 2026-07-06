import { MAX_CONTENT_LENGTH } from "@/constants";

export function computeChecksum(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function computeWordCount(content: string): number {
  const stripped = content.replace(/<[^>]*>/g, " ").trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

export function computeCharCount(content: string): number {
  return content.replace(/<[^>]*>/g, "").length;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export interface ContentDiff {
  additions: number;
  deletions: number;
  changes: Array<{ position: number; removed: string; added: string }>;
}

export function diffContent(oldContent: string, newContent: string): ContentDiff {
  if (oldContent === newContent) {
    return { additions: 0, deletions: 0, changes: [] };
  }

  const changes: ContentDiff["changes"] = [];
  let prefixLen = 0;
  const minLen = Math.min(oldContent.length, newContent.length);

  while (
    prefixLen < minLen &&
    oldContent[prefixLen] === newContent[prefixLen]
  ) {
    prefixLen++;
  }

  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    oldContent[oldContent.length - 1 - suffixLen] ===
      newContent[newContent.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const removed = oldContent.slice(
    prefixLen,
    oldContent.length - suffixLen
  );
  const added = newContent.slice(
    prefixLen,
    newContent.length - suffixLen
  );

  if (removed || added) {
    changes.push({ position: prefixLen, removed, added });
  }

  return {
    additions: Math.max(0, newContent.length - oldContent.length),
    deletions: Math.max(0, oldContent.length - newContent.length),
    changes,
  };
}

export function applyContentPatch(
  content: string,
  position: number,
  removedLength: number,
  insertedText: string
): string {
  const before = content.slice(0, position);
  const after = content.slice(position + removedLength);
  const result = before + insertedText + after;
  if (result.length > MAX_CONTENT_LENGTH) {
    throw new Error(`Content exceeds maximum length of ${MAX_CONTENT_LENGTH}`);
  }
  return result;
}

export function clampPosition(position: number, contentLength: number): number {
  return Math.max(0, Math.min(position, contentLength));
}

export function extractPlainTextPreview(
  content: string,
  maxLength = 120
): string {
  const plain = stripHtml(content).replace(/\s+/g, " ").trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength) + "…";
}
