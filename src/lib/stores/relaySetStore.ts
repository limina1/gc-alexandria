import { writable, derived, get } from "svelte/store";
import type NDK from "@nostr-dev-kit/ndk";
import { NDKEvent, NDKRelaySet } from "@nostr-dev-kit/ndk";
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
import { searchRelays } from "../consts.ts";

/**
 * Helper to get user's write relays for publishing settings
 * Tries userStore first, falls back to extension's getRelays(), then fetches NIP-65
 */
async function getUserWriteRelays(ndk: NDK): Promise<NDKRelaySet | undefined> {
  const user = get(userStore);
  let writeRelayUrls = user.relays?.outbox || [];

  console.log("[RelaySetStore] userStore outbox relays:", writeRelayUrls);

  // Fallback 1: try extension directly if userStore is empty
  if (writeRelayUrls.length === 0 && typeof globalThis !== "undefined" && globalThis.nostr?.getRelays) {
    console.log("[RelaySetStore] Trying extension getRelays() fallback...");
    try {
      const extRelays = await globalThis.nostr.getRelays();
      writeRelayUrls = Object.entries(extRelays || {})
        .filter(([_, config]) => (config as { write?: boolean }).write)
        .map(([url, _]) => url);
      console.log("[RelaySetStore] Extension write relays:", writeRelayUrls);
    } catch (error) {
      console.warn("[RelaySetStore] Error getting relays from extension:", error);
    }
  }

  // Fallback 2: fetch NIP-65 relay list from known relays (like jumble does)
  if (writeRelayUrls.length === 0 && user.pubkey) {
    console.log("[RelaySetStore] Trying to fetch NIP-65 relay list from known relays...");
    try {
      // Use searchRelays (similar to jumble's BIG_RELAY_URLS) to find user's relay list
      const relayListEvents = await ndk.fetchEvents(
        {
          kinds: [10002 as any], // NIP-65 relay list
          authors: [user.pubkey],
          limit: 1,
        },
        { closeOnEose: true },
        NDKRelaySet.fromRelayUrls(searchRelays.slice(0, 4), ndk),
      );

      // Parse NIP-65 relay list to get write relays
      for (const event of relayListEvents) {
        for (const tag of event.tags) {
          if (tag[0] === "r" && tag[1]) {
            // "r" tags: tag[1] is URL, tag[2] is optional "read"/"write" marker
            // If no marker, it's both read and write
            const marker = tag[2]?.toLowerCase();
            if (!marker || marker === "write") {
              writeRelayUrls.push(tag[1]);
            }
          }
        }
      }
      console.log("[RelaySetStore] NIP-65 write relays:", writeRelayUrls);
    } catch (error) {
      console.warn("[RelaySetStore] Error fetching NIP-65 relay list:", error);
    }
  }

  if (writeRelayUrls.length === 0) {
    console.warn("[RelaySetStore] No write relays found - using default pool");
    return undefined;
  }

  console.log("[RelaySetStore] Using write relays:", writeRelayUrls);

  // Ensure relays are in the pool and connected
  const { NDKRelay, NDKRelayAuthPolicies } = await import("@nostr-dev-kit/ndk");

  const connectedRelays: Set<import("@nostr-dev-kit/ndk").NDKRelay> = new Set();
  const poolRelays = Array.from(ndk.pool?.relays.values() || []);

  for (const url of writeRelayUrls) {
    // Normalize URL for comparison
    const normalizedUrl = url.replace(/\/$/, "").toLowerCase();

    // Check if relay is already in pool
    const existingRelay = poolRelays.find(
      (r) => r.url.replace(/\/$/, "").toLowerCase() === normalizedUrl
    );

    if (existingRelay) {
      console.log("[RelaySetStore] Relay already in pool:", existingRelay.url);
      connectedRelays.add(existingRelay);
    } else {
      // Add new relay to pool
      try {
        console.log("[RelaySetStore] Adding relay to pool:", url);
        const relay = new NDKRelay(url, NDKRelayAuthPolicies.signIn({ ndk }), ndk);
        ndk.pool?.addRelay(relay);
        // Start connection (don't await - let it connect in background)
        relay.connect().catch((err) => {
          console.debug(`[RelaySetStore] Relay ${url} connection deferred:`, err);
        });
        connectedRelays.add(relay);
      } catch (error) {
        console.warn(`[RelaySetStore] Failed to add relay ${url}:`, error);
      }
    }
  }

  if (connectedRelays.size > 0) {
    // Wait a moment for new relays to connect
    const hasConnected = Array.from(connectedRelays).some((r) => r.status === 1); // 1 = CONNECTED
    if (!hasConnected) {
      console.log("[RelaySetStore] Waiting for relay connections...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    console.log("[RelaySetStore] Created relay set with", connectedRelays.size, "relays");
    return new NDKRelaySet(connectedRelays, ndk);
  }

  return undefined;
}

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
    // Get user's write relays - relay sets are stored on user's relays, not default pool
    let userRelays = await getUserWriteRelays(ndk);

    // If no user relays, try using the NDK pool directly or fallback to search relays
    if (!userRelays) {
      const poolRelays = Array.from(ndk.pool?.relays.values() || []);
      if (poolRelays.length > 0) {
        console.log("[RelaySetStore] Using NDK pool relays:", poolRelays.map(r => r.url));
        userRelays = new NDKRelaySet(new Set(poolRelays), ndk);
      } else {
        // Last resort: use search relays as fallback (like jumble's BIG_RELAY_URLS)
        console.log("[RelaySetStore] Using fallback search relays:", searchRelays.slice(0, 3));
        userRelays = NDKRelaySet.fromRelayUrls(searchRelays.slice(0, 3), ndk);
      }
    }

    console.log("[RelaySetStore] Fetching relay sets from:",
      userRelays ? Array.from(userRelays.relays).map(r => r.url) : "default pool");

    // Fetch with a timeout to prevent infinite loading
    const FETCH_TIMEOUT = 10000; // 10 seconds

    const fetchPromise = ndk.fetchEvents(
      {
        kinds: [30002 as any, 10012 as any],
        authors: [pubkey],
      },
      { closeOnEose: true },
      userRelays,
    );

    const timeoutPromise = new Promise<Set<NDKEvent>>((_, reject) => {
      setTimeout(() => reject(new Error("Fetch timeout")), FETCH_TIMEOUT);
    });

    let events: Set<NDKEvent>;
    try {
      events = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (timeoutError) {
      console.warn("[RelaySetStore] Fetch timed out, continuing with empty results");
      events = new Set();
    }

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

    // Sign and publish to user's write relays (not the current pool which may reject this kind)
    await event.sign();
    const publishRelaySet = await getUserWriteRelays(ndk);
    await event.publish(publishRelaySet);

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

    // Sign and publish to user's write relays
    await event.sign();
    const publishRelaySet = await getUserWriteRelays(ndk);
    await event.publish(publishRelaySet);

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
    const publishRelaySet = await getUserWriteRelays(ndk);
    await event.publish(publishRelaySet);

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

    // Add new relays to NDK pool FIRST, before updating stores
    // This prevents race conditions where effects try to use empty pool
    const deduped = deduplicateRelayUrls(relays);
    console.log(`[RelaySetStore] Adding ${deduped.length} new relays to pool`);

    // Import NDK classes once
    const { NDKRelay, NDKRelayAuthPolicies } = await import("@nostr-dev-kit/ndk");

    const connectionPromises: Promise<void>[] = [];
    for (const url of deduped) {
      try {
        // URL is already normalized by deduplicateRelayUrls (handles ws:// vs wss:// for local relays)
        const relay = new NDKRelay(url, NDKRelayAuthPolicies.signIn({ ndk }), ndk);
        ndk.pool?.addRelay(relay);
        console.log(`[RelaySetStore] Added relay: ${url}`);

        // Collect connection promises
        connectionPromises.push(
          relay.connect().catch((err) => {
            console.debug(`[RelaySetStore] Relay ${url} connection deferred:`, err);
          })
        );
      } catch (error) {
        console.warn(`[RelaySetStore] Failed to add relay ${url}:`, error);
      }
    }

    // Wait for at least one relay to connect (with timeout)
    console.log("[RelaySetStore] Waiting for relay connections...");
    await Promise.race([
      Promise.any(connectionPromises).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);

    console.log(`[RelaySetStore] NDK pool now has ${ndk.pool?.relays.size || 0} relays`);

    // NOW update Alexandria's active relay stores (after pool is populated)
    activeInboxRelays.set(relays);
    activeOutboxRelays.set(relays);

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

  // Sign and publish to user's write relays
  await event.sign();
  const publishRelaySet = await getUserWriteRelays(ndk);
  await event.publish(publishRelaySet);

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
