import { writable, derived, get } from "svelte/store";
import type NDK from "@nostr-dev-kit/ndk";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { userStore } from "./userStore.ts";
import {
  activeInboxRelays,
  activeOutboxRelays,
  updateActiveRelayStores,
  clearRelaySetCache,
} from "../ndk.ts";
import {
  type RelaySet,
  type FavoriteRelays,
  createRelaySetEvent,
  createFavoriteRelaysEvent,
  parseRelaySetEvent,
  parseFavoriteRelaysEvent,
  buildRelaySetATag,
  validateRelaySet,
} from "../utils/relay_set_management.ts";
import { deduplicateRelayUrls } from "../utils/relay_management.ts";

/**
 * Relay Set Store State Interface
 */
export interface RelaySetState {
  relaySets: RelaySet[];
  favoriteRelays: string[];
  activeSetId: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial state
 */
const initialState: RelaySetState = {
  relaySets: [],
  favoriteRelays: [],
  activeSetId: null,
  isLoading: false,
  error: null,
};

/**
 * Main relay set store
 */
export const relaySetStore = writable<RelaySetState>(initialState);

/**
 * Store that increments whenever relays are switched
 * Components can subscribe to this to know when to refetch data
 */
export const relaySwitchCounter = writable<number>(0);

/**
 * Derived store for the currently active relay set
 */
export const activeRelaySet = derived(relaySetStore, ($store) => {
  if (!$store.activeSetId) return null;
  return $store.relaySets.find((set) => set.id === $store.activeSetId) || null;
});

/**
 * Derived store for all available relays (from sets and favorites)
 */
export const allAvailableRelays = derived(relaySetStore, ($store) => {
  const relaysFromSets = $store.relaySets.flatMap((set) => set.relays);
  return deduplicateRelayUrls([...relaysFromSets, ...$store.favoriteRelays]);
});

/**
 * Storage key for persisting active set selection
 */
const ACTIVE_SET_STORAGE_KEY = "alexandria/relay_sets/active";

/**
 * Fetch relay sets and favorite relays for a user
 * @param pubkey - User's public key
 * @param ndk - NDK instance
 */
export async function fetchRelaySets(
  pubkey: string,
  ndk: NDK,
): Promise<void> {
  relaySetStore.update((state) => ({ ...state, isLoading: true, error: null }));

  try {
    // Fetch kind 30002 (relay sets) and kind 10012 (favorite relays) events
    const events = await ndk.fetchEvents({
      kinds: [30002 as any, 10012 as any],
      authors: [pubkey],
    });

    const relaySets: RelaySet[] = [];
    let favoriteRelaysData: FavoriteRelays | null = null;

    // Parse events
    for (const event of events) {
      if (event.kind === 30002) {
        const relaySet = parseRelaySetEvent(event);
        if (relaySet) {
          relaySets.push(relaySet);
        }
      } else if (event.kind === 10012) {
        // Only keep the most recent favorite relays event
        if (
          !favoriteRelaysData ||
          !favoriteRelaysData.event ||
          event.created_at! > favoriteRelaysData.event.created_at!
        ) {
          favoriteRelaysData = parseFavoriteRelaysEvent(event);
        }
      }
    }

    // Update store
    relaySetStore.update((state) => ({
      ...state,
      relaySets,
      favoriteRelays: favoriteRelaysData?.relays || [],
      isLoading: false,
    }));

    console.log(
      `[RelaySetStore] Fetched ${relaySets.length} relay sets and ${favoriteRelaysData?.relays.length || 0} favorite relays`,
    );
  } catch (error) {
    console.error("[RelaySetStore] Error fetching relay sets:", error);
    relaySetStore.update((state) => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error.message : "Failed to fetch relay sets",
    }));
  }
}

/**
 * Create a new relay set
 * @param title - Name of the relay set
 * @param relays - Array of relay URLs
 * @param ndk - NDK instance
 * @returns The created relay set or null if failed
 */
export async function createRelaySet(
  title: string,
  relays: string[],
  ndk: NDK,
): Promise<RelaySet | null> {
  // Validate
  const validationError = validateRelaySet({ title, relays });
  if (validationError) {
    relaySetStore.update((state) => ({ ...state, error: validationError }));
    throw new Error(validationError);
  }

  if (!ndk.signer) {
    throw new Error("No signer available");
  }

  try {
    // Create event
    const eventData = createRelaySetEvent(title, relays);
    const event = new NDKEvent(ndk);
    event.kind = eventData.kind;
    event.tags = eventData.tags;
    event.content = eventData.content;

    // Sign and publish
    await event.sign();
    await event.publish();

    // Parse and add to store
    const relaySet = parseRelaySetEvent(event);
    if (relaySet) {
      relaySetStore.update((state) => ({
        ...state,
        relaySets: [...state.relaySets, relaySet],
      }));

      // Update favorite relays event to include reference
      await updateFavoriteRelaysEvent(ndk);

      console.log(`[RelaySetStore] Created relay set: ${title}`);
      return relaySet;
    }

    return null;
  } catch (error) {
    console.error("[RelaySetStore] Error creating relay set:", error);
    relaySetStore.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Failed to create relay set",
    }));
    throw error;
  }
}

/**
 * Update an existing relay set
 * @param setId - ID of the relay set to update
 * @param updates - Partial updates (title and/or relays)
 * @param ndk - NDK instance
 */
export async function updateRelaySet(
  setId: string,
  updates: { title?: string; relays?: string[] },
  ndk: NDK,
): Promise<void> {
  if (!ndk.signer) {
    throw new Error("No signer available");
  }

  const state = get(relaySetStore);
  const existingSet = state.relaySets.find((set) => set.id === setId);

  if (!existingSet) {
    throw new Error("Relay set not found");
  }

  try {
    // Merge updates with existing data
    const title = updates.title || existingSet.title;
    const relays = updates.relays || existingSet.relays;

    // Validate
    const validationError = validateRelaySet({ title, relays });
    if (validationError) {
      throw new Error(validationError);
    }

    // Create updated event (uses same d-tag, so it replaces the old one)
    const eventData = createRelaySetEvent(title, relays, setId);
    const event = new NDKEvent(ndk);
    event.kind = eventData.kind;
    event.tags = eventData.tags;
    event.content = eventData.content;

    // Sign and publish
    await event.sign();
    await event.publish();

    // Update store
    const updatedSet = parseRelaySetEvent(event);
    if (updatedSet) {
      relaySetStore.update((state) => ({
        ...state,
        relaySets: state.relaySets.map((set) =>
          set.id === setId ? updatedSet : set,
        ),
      }));

      // If this is the active set, update active relays
      if (state.activeSetId === setId) {
        await setActiveRelaySet(setId, ndk);
      }

      console.log(`[RelaySetStore] Updated relay set: ${setId}`);
    }
  } catch (error) {
    console.error("[RelaySetStore] Error updating relay set:", error);
    relaySetStore.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Failed to update relay set",
    }));
    throw error;
  }
}

/**
 * Delete a relay set
 * @param setId - ID of the relay set to delete
 * @param ndk - NDK instance
 */
export async function deleteRelaySet(setId: string, ndk: NDK): Promise<void> {
  if (!ndk.signer) {
    throw new Error("No signer available");
  }

  const state = get(relaySetStore);
  const existingSet = state.relaySets.find((set) => set.id === setId);

  if (!existingSet) {
    throw new Error("Relay set not found");
  }

  try {
    // Create a deletion event (kind 5)
    const event = new NDKEvent(ndk);
    event.kind = 5; // Deletion event
    event.tags = [["a", `30002:${ndk.activeUser?.pubkey}:${setId}`]];
    event.content = "Deleted relay set";

    await event.sign();
    await event.publish();

    // Update store
    relaySetStore.update((state) => ({
      ...state,
      relaySets: state.relaySets.filter((set) => set.id !== setId),
      activeSetId: state.activeSetId === setId ? null : state.activeSetId,
    }));

    // Update favorite relays event to remove reference
    await updateFavoriteRelaysEvent(ndk);

    // If this was the active set, reset to favorites
    if (state.activeSetId === setId) {
      await setActiveRelaySet(null, ndk);
    }

    console.log(`[RelaySetStore] Deleted relay set: ${setId}`);
  } catch (error) {
    console.error("[RelaySetStore] Error deleting relay set:", error);
    relaySetStore.update((state) => ({
      ...state,
      error: error instanceof Error ? error.message : "Failed to delete relay set",
    }));
    throw error;
  }
}

/**
 * Set the active relay set (or null to use favorites)
 * This is the key integration function that updates the NDK relay pool
 * @param setId - ID of relay set to activate, or null for favorites
 * @param ndk - NDK instance
 */
export async function setActiveRelaySet(
  setId: string | null,
  ndk: NDK,
): Promise<void> {
  const state = get(relaySetStore);

  // Get relays from selected set or favorites
  let relays: string[];
  if (setId) {
    const set = state.relaySets.find((s) => s.id === setId);
    if (!set) {
      throw new Error("Relay set not found");
    }
    relays = set.relays;
  } else {
    relays = state.favoriteRelays;
  }

  // Fallback to current relays if no relays specified
  if (relays.length === 0) {
    console.warn("[RelaySetStore] No relays in selected set, using defaults");
    relays = [...get(activeInboxRelays), ...get(activeOutboxRelays)];
    relays = deduplicateRelayUrls(relays);
  }

  try {
    console.log(
      `[RelaySetStore] Switching to relay set: ${setId || "favorites"} (${relays.length} relays)`,
    );
    console.log("[RelaySetStore] New relays:", relays);

    // Clear the persistent relay cache from ndk.ts to force fresh fetches
    clearRelaySetCache();
    console.log("[RelaySetStore] Cleared relay set cache");

    // CRITICAL: Clear existing relays from NDK pool first
    const currentRelays = Array.from(ndk.pool?.relays.values() || []);
    console.log(`[RelaySetStore] Removing ${currentRelays.length} existing relays from pool`);

    for (const relay of currentRelays) {
      try {
        // Disconnect and remove the relay
        relay.disconnect();
        ndk.pool?.removeRelay(relay.url);
      } catch (error) {
        console.warn(`[RelaySetStore] Error removing relay ${relay.url}:`, error);
      }
    }

    // Update Alexandria's active relay stores
    activeInboxRelays.set(relays);
    activeOutboxRelays.set(relays);

    // Add new relays to NDK pool
    const deduped = deduplicateRelayUrls(relays);
    console.log(`[RelaySetStore] Adding ${deduped.length} new relays to pool`);

    for (const url of deduped) {
      try {
        // Import createRelayWithAuth from ndk.ts
        const NDKRelay = (await import("@nostr-dev-kit/ndk")).NDKRelay;
        const NDKRelayAuthPolicies = (await import("@nostr-dev-kit/ndk")).NDKRelayAuthPolicies;

        // Determine protocol
        const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
        const protocol = isLocal ? "ws://" : "wss://";
        const normalizedUrl = url.startsWith("ws://") || url.startsWith("wss://")
          ? url
          : `${protocol}${url}`;

        const relay = new NDKRelay(normalizedUrl, NDKRelayAuthPolicies.signIn({ ndk }), ndk);
        relay.connect().catch((err) => {
          console.debug(`[RelaySetStore] Relay ${normalizedUrl} connection deferred:`, err);
        });

        ndk.pool?.addRelay(relay);
        console.log(`[RelaySetStore] Added relay: ${normalizedUrl}`);
      } catch (error) {
        console.warn(`[RelaySetStore] Failed to add relay ${url}:`, error);
      }
    }

    // Update store state
    relaySetStore.update((state) => ({
      ...state,
      activeSetId: setId,
    }));

    // Persist selection to localStorage
    if (typeof window !== "undefined") {
      if (setId) {
        localStorage.setItem(ACTIVE_SET_STORAGE_KEY, setId);
      } else {
        localStorage.removeItem(ACTIVE_SET_STORAGE_KEY);
      }
    }

    console.log(
      `[RelaySetStore] ✅ Successfully switched to relay set: ${setId || "favorites"}`,
    );
    console.log(`[RelaySetStore] NDK pool now has ${ndk.pool?.relays.size || 0} relays`);

    // Increment switch counter to signal components to refetch data
    relaySwitchCounter.update((n) => n + 1);
    console.log("[RelaySetStore] Signaled relay switch to subscribers");
  } catch (error) {
    console.error("[RelaySetStore] Error setting active relay set:", error);
    throw error;
  }
}

/**
 * Add a relay to favorites
 * @param relayUrl - Relay URL to add
 * @param ndk - NDK instance
 */
export async function addToFavorites(
  relayUrl: string,
  ndk: NDK,
): Promise<void> {
  const state = get(relaySetStore);

  if (state.favoriteRelays.includes(relayUrl)) {
    console.log(`[RelaySetStore] Relay already in favorites: ${relayUrl}`);
    return;
  }

  try {
    // Update store optimistically
    relaySetStore.update((state) => ({
      ...state,
      favoriteRelays: [...state.favoriteRelays, relayUrl],
    }));

    // Publish updated favorite relays event
    await updateFavoriteRelaysEvent(ndk);

    console.log(`[RelaySetStore] Added to favorites: ${relayUrl}`);
  } catch (error) {
    // Rollback on error
    relaySetStore.update((state) => ({
      ...state,
      favoriteRelays: state.favoriteRelays.filter((url) => url !== relayUrl),
      error: error instanceof Error ? error.message : "Failed to add to favorites",
    }));
    throw error;
  }
}

/**
 * Remove a relay from favorites
 * @param relayUrl - Relay URL to remove
 * @param ndk - NDK instance
 */
export async function removeFromFavorites(
  relayUrl: string,
  ndk: NDK,
): Promise<void> {
  try {
    // Update store
    relaySetStore.update((state) => ({
      ...state,
      favoriteRelays: state.favoriteRelays.filter((url) => url !== relayUrl),
    }));

    // Publish updated favorite relays event
    await updateFavoriteRelaysEvent(ndk);

    console.log(`[RelaySetStore] Removed from favorites: ${relayUrl}`);
  } catch (error) {
    console.error("[RelaySetStore] Error removing from favorites:", error);
    throw error;
  }
}

/**
 * Update the kind 10012 favorite relays event
 * Includes both individual relays and references to relay sets
 * @param ndk - NDK instance
 */
async function updateFavoriteRelaysEvent(ndk: NDK): Promise<void> {
  if (!ndk.signer) {
    throw new Error("No signer available");
  }

  const state = get(relaySetStore);

  // Build relay set references (a-tags)
  const relaySetRefs = state.relaySets
    .map((set) => {
      if (set.event) {
        return buildRelaySetATag(set.event);
      }
      // Fallback if event is not available
      return `30002:${ndk.activeUser?.pubkey}:${set.id}`;
    })
    .filter((ref) => ref !== null) as string[];

  // Create event
  const eventData = createFavoriteRelaysEvent(
    state.favoriteRelays,
    relaySetRefs,
  );
  const event = new NDKEvent(ndk);
  event.kind = eventData.kind;
  event.tags = eventData.tags;
  event.content = eventData.content;

  // Sign and publish
  await event.sign();
  await event.publish();

  console.log(
    `[RelaySetStore] Updated favorite relays event (${state.favoriteRelays.length} relays, ${relaySetRefs.length} set refs)`,
  );
}

/**
 * Restore active relay set from localStorage
 * @param ndk - NDK instance
 */
async function restoreActiveRelaySet(ndk: NDK): Promise<void> {
  if (typeof window === "undefined") return;

  const savedSetId = localStorage.getItem(ACTIVE_SET_STORAGE_KEY);
  if (savedSetId) {
    const state = get(relaySetStore);
    const set = state.relaySets.find((s) => s.id === savedSetId);
    if (set) {
      await setActiveRelaySet(savedSetId, ndk);
      console.log(`[RelaySetStore] Restored active relay set: ${savedSetId}`);
    } else {
      // Clean up invalid reference
      localStorage.removeItem(ACTIVE_SET_STORAGE_KEY);
    }
  }
}

/**
 * Initialize relay set store - subscribe to user store changes
 * This should be called once in the app initialization
 */
export function initializeRelaySetStore(ndk: NDK): void {
  // Check current user state immediately (in case already signed in)
  const currentUser = get(userStore);
  if (currentUser.signedIn && currentUser.pubkey) {
    console.log("[RelaySetStore] User already signed in, fetching relay sets immediately");
    fetchRelaySets(currentUser.pubkey, ndk).then(() => {
      restoreActiveRelaySet(ndk);
    });
  }

  // Subscribe to future changes
  userStore.subscribe(async (user) => {
    if (user.signedIn && user.pubkey) {
      console.log("[RelaySetStore] User signed in, fetching relay sets");
      await fetchRelaySets(user.pubkey, ndk);
      await restoreActiveRelaySet(ndk);
    } else {
      // Reset store when user signs out
      relaySetStore.set(initialState);
      console.log("[RelaySetStore] User signed out, reset store");
    }
  });
}
