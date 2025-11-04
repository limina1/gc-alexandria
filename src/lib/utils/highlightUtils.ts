/**
 * Utility functions for text highlighting and positioning
 */

import type { NDKEvent } from "@nostr-dev-kit/ndk";

export interface HighlightPosition {
  startOffset: number;
  endOffset: number;
  textContent: string;
}

export interface HighlightMatch {
  event: NDKEvent;
  position: HighlightPosition | null;
  element: HTMLElement | null;
}

/**
 * Extract highlighted text from a highlight event (kind 9802)
 */
export function getHighlightedText(event: NDKEvent): string {
  return event.content || "";
}

/**
 * Get the context surrounding a highlight (if available)
 */
export function getHighlightContext(event: NDKEvent): string | null {
  const contextTag = event.getMatchingTags("context")[0];
  return contextTag ? contextTag[1] : null;
}

/**
 * Get the comment associated with a highlight
 */
export function getHighlightComment(event: NDKEvent): string | null {
  const commentTag = event.getMatchingTags("comment")[0];
  return commentTag ? commentTag[1] : null;
}

/**
 * Check if a highlight event references a specific publication
 */
export function highlightReferencesPublication(
  event: NDKEvent,
  publicationAddress: string
): boolean {
  // Check a-tags for publication reference
  const aTags = event.getMatchingTags("a");
  return aTags.some((tag) => tag[1] === publicationAddress);
}

/**
 * Find text in an element and return its position
 * Uses a simple text search algorithm
 */
export function findTextInElement(
  element: HTMLElement,
  searchText: string
): HighlightPosition | null {
  const textContent = element.textContent || "";
  const cleanSearch = searchText.trim();

  if (!cleanSearch) return null;

  // Try to find exact match first
  let index = textContent.indexOf(cleanSearch);

  if (index !== -1) {
    return {
      startOffset: index,
      endOffset: index + cleanSearch.length,
      textContent: cleanSearch,
    };
  }

  // Try normalized search (remove extra whitespace)
  const normalizedText = textContent.replace(/\s+/g, " ");
  const normalizedSearch = cleanSearch.replace(/\s+/g, " ");

  index = normalizedText.indexOf(normalizedSearch);

  if (index !== -1) {
    return {
      startOffset: index,
      endOffset: index + normalizedSearch.length,
      textContent: normalizedSearch,
    };
  }

  return null;
}

/**
 * Create highlight spans in the DOM at specified positions
 * Returns the created highlight elements
 */
export function createHighlightElements(
  container: HTMLElement,
  highlights: Array<{ position: HighlightPosition; eventId: string }>
): Array<{ element: HTMLElement; eventId: string }> {
  const result: Array<{ element: HTMLElement; eventId: string }> = [];

  // Sort highlights by start position (reverse order to handle DOM modifications)
  const sortedHighlights = [...highlights].sort(
    (a, b) => b.position.startOffset - a.position.startOffset
  );

  for (const highlight of sortedHighlights) {
    try {
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentOffset = 0;
      let textNode: Text | null = null;

      // Find the text node that contains our highlight
      while ((textNode = walker.nextNode() as Text | null)) {
        const nodeLength = textNode.textContent?.length || 0;

        if (
          currentOffset + nodeLength > highlight.position.startOffset &&
          currentOffset <= highlight.position.endOffset
        ) {
          // Found the text node containing (part of) our highlight
          const nodeStart = Math.max(0, highlight.position.startOffset - currentOffset);
          const nodeEnd = Math.min(
            nodeLength,
            highlight.position.endOffset - currentOffset
          );

          // Split the text node if needed
          if (nodeStart > 0) {
            textNode = textNode.splitText(nodeStart) as Text;
            currentOffset += nodeStart;
          }

          if (nodeEnd < (textNode.textContent?.length || 0)) {
            textNode.splitText(nodeEnd - nodeStart);
          }

          // Wrap the text node in a highlight span
          const span = document.createElement("span");
          span.className = "highlight-overlay";
          span.dataset.highlightId = highlight.eventId;
          span.style.cssText = `
            background: rgba(255, 235, 59, 0.3);
            border-bottom: 2px solid rgba(255, 193, 7, 0.6);
            cursor: pointer;
            transition: background 0.2s ease;
          `;

          const parent = textNode.parentNode;
          if (parent) {
            parent.insertBefore(span, textNode);
            span.appendChild(textNode);

            result.push({
              element: span,
              eventId: highlight.eventId,
            });
          }

          break;
        }

        currentOffset += nodeLength;
      }
    } catch (error) {
      console.warn("Error creating highlight element:", error);
    }
  }

  return result;
}

/**
 * Remove all highlight overlays from an element
 */
export function removeHighlightElements(container: HTMLElement): void {
  const highlights = container.querySelectorAll(".highlight-overlay");
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    if (parent) {
      // Move children out of the highlight span
      while (highlight.firstChild) {
        parent.insertBefore(highlight.firstChild, highlight);
      }
      parent.removeChild(highlight);
    }
  });

  // Normalize text nodes to merge adjacent text nodes
  container.normalize();
}

/**
 * Get RGB color with alpha for highlight background
 */
export function getHighlightColor(alpha: number = 0.3): string {
  return `rgba(255, 235, 59, ${alpha})`;
}
