import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { normalizeRelayUrl } from "./relay_management.ts";

/**
 * NIP-51 Relay Set Management Utilities
 * Handles creation and parsing of kind 30002 (relay sets) and kind 10012 (favorite relays) events
 */

export interface RelaySet {
  id: string; // d-tag value
  title: string; // title tag value
  relays: string[]; // normalized relay URLs
  event?: NDKEvent; // source event
}

export interface FavoriteRelays {
  relays: string[]; // individual favorite relays
  relaySetRefs: string[]; // references to relay sets (a-tags)
  event?: NDKEvent; // source event
}

/**
 * Generate a unique identifier for a relay set
 * Uses timestamp + random string for uniqueness
 */
export function generateRelaySetId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${timestamp}-${random}`;
}

/**
 * Create a kind 30002 relay set event
 * @param title - Human-readable name for the relay set
 * @param relays - Array of relay URLs
 * @param id - Optional custom identifier (generated if not provided)
 * @returns Object with kind, tags, and content for NDKEvent
 */
export function createRelaySetEvent(
  title: string,
  relays: string[],
  id?: string,
): { kind: number; tags: string[][]; content: string } {
  const setId = id || generateRelaySetId();
  const normalizedRelays = relays
    .map((url) => normalizeRelayUrl(url))
    .filter((url) => url && url.length > 0);

  return {
    kind: 30002,
    tags: [
      ["d", setId],
      ["title", title],
      ...normalizedRelays.map((url) => ["relay", url]),
    ],
    content: "",
  };
}

/**
 * Create a kind 10012 favorite relays event
 * @param relays - Array of individual favorite relay URLs
 * @param relaySetRefs - Array of relay set references in format "30002:pubkey:d-tag"
 * @returns Object with kind, tags, and content for NDKEvent
 */
export function createFavoriteRelaysEvent(
  relays: string[],
  relaySetRefs: string[],
): { kind: number; tags: string[][]; content: string } {
  const normalizedRelays = relays
    .map((url) => normalizeRelayUrl(url))
    .filter((url) => url && url.length > 0);

  return {
    kind: 10012,
    tags: [
      ...normalizedRelays.map((url) => ["relay", url]),
      ...relaySetRefs.map((ref) => ["a", ref]),
    ],
    content: "",
  };
}

/**
 * Parse a kind 30002 relay set event into a RelaySet object
 * @param event - NDKEvent of kind 30002
 * @returns RelaySet object or null if invalid
 */
export function parseRelaySetEvent(event: NDKEvent): RelaySet | null {
  if (event.kind !== 30002) {
    console.warn("parseRelaySetEvent: Event is not kind 30002");
    return null;
  }

  // Extract d-tag (identifier)
  const dTags = event.getMatchingTags("d");
  if (dTags.length === 0 || !dTags[0][1]) {
    console.warn("parseRelaySetEvent: Event missing d-tag");
    return null;
  }
  const id = dTags[0][1];

  // Extract title
  const titleTags = event.getMatchingTags("title");
  const title = titleTags.length > 0 && titleTags[0][1] ? titleTags[0][1] : id;

  // Extract relay URLs
  const relayTags = event.getMatchingTags("relay");
  const relays = relayTags
    .map((tag) => tag[1])
    .filter((url) => url && url.length > 0)
    .map((url) => normalizeRelayUrl(url))
    .filter((url) => url && url.length > 0);

  return {
    id,
    title,
    relays,
    event,
  };
}

/**
 * Parse a kind 10012 favorite relays event into a FavoriteRelays object
 * @param event - NDKEvent of kind 10012
 * @returns FavoriteRelays object or null if invalid
 */
export function parseFavoriteRelaysEvent(
  event: NDKEvent,
): FavoriteRelays | null {
  if (event.kind !== 10012) {
    console.warn("parseFavoriteRelaysEvent: Event is not kind 10012");
    return null;
  }

  // Extract relay URLs
  const relayTags = event.getMatchingTags("relay");
  const relays = relayTags
    .map((tag) => tag[1])
    .filter((url) => url && url.length > 0)
    .map((url) => normalizeRelayUrl(url))
    .filter((url) => url && url.length > 0);

  // Extract relay set references (a-tags)
  const aTags = event.getMatchingTags("a");
  const relaySetRefs = aTags
    .map((tag) => tag[1])
    .filter((ref) => ref && ref.startsWith("30002:"));

  return {
    relays,
    relaySetRefs,
    event,
  };
}

/**
 * Build an NIP-33 'a' tag reference for a relay set event
 * Format: "30002:pubkey:d-tag"
 * @param event - NDKEvent of kind 30002
 * @returns 'a' tag string or null if invalid
 */
export function buildRelaySetATag(event: NDKEvent): string | null {
  if (event.kind !== 30002) {
    return null;
  }

  const dTags = event.getMatchingTags("d");
  if (dTags.length === 0 || !dTags[0][1]) {
    return null;
  }

  const dTag = dTags[0][1];
  return `30002:${event.pubkey}:${dTag}`;
}

/**
 * Extract the d-tag value from an 'a' tag reference
 * @param aTag - 'a' tag string in format "30002:pubkey:d-tag"
 * @returns d-tag value or null if invalid
 */
export function extractDTagFromATag(aTag: string): string | null {
  const parts = aTag.split(":");
  if (parts.length !== 3 || parts[0] !== "30002") {
    return null;
  }
  return parts[2];
}

/**
 * Validate a relay set
 * @param relaySet - RelaySet object to validate
 * @returns Error message if invalid, null if valid
 */
export function validateRelaySet(relaySet: {
  title: string;
  relays: string[];
}): string | null {
  if (!relaySet.title || relaySet.title.trim().length === 0) {
    return "Title is required";
  }

  if (relaySet.title.length > 100) {
    return "Title must be 100 characters or less";
  }

  if (!relaySet.relays || relaySet.relays.length === 0) {
    return "At least one relay is required";
  }

  // Validate each relay URL
  for (const relay of relaySet.relays) {
    if (!relay.startsWith("wss://") && !relay.startsWith("ws://")) {
      return `Invalid relay URL: ${relay} (must start with wss:// or ws://)`;
    }
  }

  return null;
}
