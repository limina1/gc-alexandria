<script lang="ts">
  import { onMount, getContext } from "svelte";
  import type NDK from "@nostr-dev-kit/ndk";
  import type { NDKEvent } from "@nostr-dev-kit/ndk";
  import { Modal, Button, Card, P } from "flowbite-svelte";
  import { basicMarkup } from "$lib/snippets/MarkupSnippets.svelte";
  import {
    getHighlightedText,
    getHighlightContext,
    getHighlightComment,
    highlightReferencesPublication,
    findTextInElement,
    createHighlightElements,
    removeHighlightElements,
  } from "$lib/utils/highlightUtils";

  /**
   * HighlightOverlay component
   * Fetches and displays highlights (kind 9802) on publication content
   */

  let {
    publicationAddress,
    contentElement,
    enabled = true,
  }: {
    publicationAddress: string;
    contentElement: HTMLElement | null;
    enabled?: boolean;
  } = $props();

  const ndk: NDK = getContext("ndk");

  let highlights = $state<NDKEvent[]>([]);
  let isLoading = $state(false);
  let selectedHighlight = $state<NDKEvent | null>(null);
  let showCommentModal = $state(false);
  let highlightElements = $state<Array<{ element: HTMLElement; eventId: string }>>([]);

  /**
   * Fetch highlight events for this publication
   */
  async function fetchHighlights() {
    if (!enabled || !publicationAddress) return;

    isLoading = true;
    console.log("[HighlightOverlay] Fetching highlights for:", publicationAddress);

    try {
      // Subscribe to highlight events (kind 9802) that reference this publication
      const subscription = ndk.subscribe(
        {
          kinds: [9802],
          "#a": [publicationAddress],
          limit: 100,
        },
        { closeOnEose: true }
      );

      const foundHighlights: NDKEvent[] = [];

      subscription.on("event", (event: NDKEvent) => {
        console.log("[HighlightOverlay] Received highlight event:", event.id);

        // Verify the highlight references our publication
        if (highlightReferencesPublication(event, publicationAddress)) {
          foundHighlights.push(event);
        }
      });

      subscription.on("eose", () => {
        console.log(
          "[HighlightOverlay] EOSE received, found",
          foundHighlights.length,
          "highlights"
        );
        highlights = foundHighlights;
        subscription.stop();
        isLoading = false;

        // Apply highlights to the DOM
        if (contentElement) {
          applyHighlights();
        }
      });

      subscription.on("error", (error: any) => {
        console.error("[HighlightOverlay] Error fetching highlights:", error);
        isLoading = false;
      });
    } catch (error) {
      console.error("[HighlightOverlay] Error setting up subscription:", error);
      isLoading = false;
    }
  }

  /**
   * Apply highlights to the content element
   */
  function applyHighlights() {
    if (!contentElement || highlights.length === 0) return;

    console.log("[HighlightOverlay] Applying", highlights.length, "highlights");

    // Remove existing highlights first
    removeHighlightElements(contentElement);

    // Find positions for each highlight
    const highlightPositions: Array<{ position: any; eventId: string }> = [];

    for (const highlight of highlights) {
      const text = getHighlightedText(highlight);
      if (!text) continue;

      const position = findTextInElement(contentElement, text);

      if (position) {
        highlightPositions.push({
          position,
          eventId: highlight.id,
        });
        console.log("[HighlightOverlay] Found position for highlight:", highlight.id);
      } else {
        console.warn(
          "[HighlightOverlay] Could not find text for highlight:",
          highlight.id,
          text.substring(0, 50)
        );
      }
    }

    // Create highlight elements
    if (highlightPositions.length > 0) {
      const elements = createHighlightElements(contentElement, highlightPositions);
      highlightElements = elements;

      // Add click handlers
      elements.forEach(({ element, eventId }) => {
        element.addEventListener("click", () => {
          const highlight = highlights.find((h) => h.id === eventId);
          if (highlight) {
            selectedHighlight = highlight;
            showCommentModal = true;
          }
        });

        // Add hover effect
        element.addEventListener("mouseenter", () => {
          element.style.background = "rgba(255, 235, 59, 0.5)";
        });

        element.addEventListener("mouseleave", () => {
          element.style.background = "rgba(255, 235, 59, 0.3)";
        });
      });

      console.log("[HighlightOverlay] Applied", elements.length, "highlight overlays");
    }
  }

  /**
   * Clean up highlights when component is destroyed
   */
  function cleanupHighlights() {
    if (contentElement) {
      removeHighlightElements(contentElement);
    }
  }

  // Watch for changes to contentElement and enabled state
  $effect(() => {
    if (enabled && contentElement && publicationAddress) {
      fetchHighlights();
    }

    return () => {
      cleanupHighlights();
    };
  });

  // Re-apply highlights when contentElement changes
  $effect(() => {
    if (contentElement && highlights.length > 0) {
      // Wait for content to be rendered
      setTimeout(() => {
        applyHighlights();
      }, 100);
    }
  });

  /**
   * Format date for display
   */
  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  /**
   * Get author name from highlight event
   */
  function getAuthorDisplay(event: NDKEvent): string {
    const pubkey = event.pubkey;
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
  }
</script>

{#if enabled}
  <!-- Comment Modal -->
  <Modal
    title="Highlight & Comment"
    bind:open={showCommentModal}
    autoclose
    outsideclose
    size="md"
  >
    {#if selectedHighlight}
      {@const highlightText = getHighlightedText(selectedHighlight)}
      {@const comment = getHighlightComment(selectedHighlight)}
      {@const context = getHighlightContext(selectedHighlight)}

      <Card class="mb-4">
        <div class="space-y-4">
          <!-- Author and date -->
          <div class="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span class="font-medium">{getAuthorDisplay(selectedHighlight)}</span>
            <span>{formatDate(selectedHighlight.created_at || 0)}</span>
          </div>

          <!-- Highlighted text -->
          <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r">
            <P class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Highlighted text:
            </P>
            {#if context}
              <div class="text-gray-700 dark:text-gray-300 italic">
                {@html context}
              </div>
            {:else}
              <div class="text-gray-800 dark:text-gray-200">
                {highlightText}
              </div>
            {/if}
          </div>

          <!-- Comment (if present) -->
          {#if comment}
            <div class="border-t pt-3">
              <P class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Comment:
              </P>
              <div class="text-gray-700 dark:text-gray-300">
                {@render basicMarkup(comment, ndk)}
              </div>
            </div>
          {/if}
        </div>
      </Card>

      <div class="flex justify-end">
        <Button color="light" onclick={() => (showCommentModal = false)}>
          Close
        </Button>
      </div>
    {/if}
  </Modal>

  <!-- Loading indicator -->
  {#if isLoading}
    <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
      Loading highlights...
    </div>
  {/if}

  <!-- Debug info (only in development) -->
  {#if import.meta.env.DEV && highlights.length > 0}
    <div class="text-xs text-gray-400 mt-2">
      {highlights.length} highlight{highlights.length !== 1 ? "s" : ""} found
    </div>
  {/if}
{/if}

<style>
  /* Additional styles for highlight overlays */
  :global(.highlight-overlay) {
    position: relative;
  }

  :global(.highlight-overlay:hover) {
    background: rgba(255, 235, 59, 0.5) !important;
  }
</style>
