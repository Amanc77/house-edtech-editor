"use client";

import type { PresenceUser } from "@/types";

interface CollaboratorCursorsProps {
  users: PresenceUser[];
  editorElement: HTMLElement | null;
}

export function CollaboratorCursors({
  users,
  editorElement,
}: CollaboratorCursorsProps) {
  if (!editorElement) return null;

  const usersWithCursors = users.filter(
    (u) => u.cursor && u.cursor.from !== undefined
  );

  if (usersWithCursors.length === 0) return null;

  return (
    <>
      {usersWithCursors.map((user) => {
        if (!user.cursor) return null;

        const coords = getCursorCoordinates(
          editorElement,
          user.cursor.from
        );

        if (!coords) return null;

        return (
          <div
            key={user.userId}
            className="collaborator-cursor pointer-events-none"
            style={{
              top: coords.top,
              left: coords.left,
              height: coords.height,
              backgroundColor: user.color,
            }}
          >
            <span
              className="collaborator-cursor-label"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </span>
          </div>
        );
      })}
    </>
  );
}

function getCursorCoordinates(
  editorElement: HTMLElement,
  position: number
): { top: number; left: number; height: number } | null {
  try {
    const proseMirror = editorElement.querySelector(".ProseMirror");
    if (!proseMirror) return null;

    const editorRect = editorElement.getBoundingClientRect();
    const containerRect = editorElement.getBoundingClientRect();

    const textNodes = getTextNodes(proseMirror);
    let charCount = 0;

    for (const node of textNodes) {
      const nodeLength = node.textContent?.length ?? 0;
      if (charCount + nodeLength >= position) {
        const range = document.createRange();
        const offset = Math.min(position - charCount, nodeLength);
        range.setStart(node, Math.max(0, offset));
        range.setEnd(node, Math.max(0, offset));
        const rect = range.getBoundingClientRect();

        return {
          top: rect.top - containerRect.top + editorElement.scrollTop,
          left: rect.left - containerRect.left,
          height: rect.height || 20,
        };
      }
      charCount += nodeLength;
    }

    return {
      top: editorRect.height / 2,
      left: 20,
      height: 20,
    };
  } catch {
    return null;
  }
}

function getTextNodes(element: Element): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  );
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    nodes.push(node);
  }
  return nodes;
}
