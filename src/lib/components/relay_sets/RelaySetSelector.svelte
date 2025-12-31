<script lang="ts">
  import { Dropdown, DropdownItem, DropdownDivider, Button, Checkbox } from "flowbite-svelte";
  import {
    relaySetStore,
    activeRelaySet,
    setActiveRelaySet,
    relaySwitchCounter,
  } from "$lib/stores/relaySetStore";
  import { getNdkContext, activeInboxRelays, activeOutboxRelays } from "$lib/ndk";
  import { userStore } from "$lib/stores/userStore";
  import RelaySetEditModal from "./RelaySetEditModal.svelte";
  import RelaySetCreateModal from "./RelaySetCreateModal.svelte";
  import type { RelaySet } from "$lib/utils/relay_set_management";
  import { NDKRelay, NDKRelayAuthPolicies } from "@nostr-dev-kit/ndk";

  const ndk = getNdkContext();

  // Derived reactive values using Svelte 5 runes
  let relaySets = $derived($relaySetStore.relaySets);
  let currentSet = $derived($activeRelaySet);
  let activeSetId = $derived($relaySetStore.activeSetId);
  let isSignedIn = $derived($userStore.signedIn);
  let isLoading = $derived($relaySetStore.isLoading);

  // Modal state
  let showEditModal = $state(false);
  let showCreateModal = $state(false);
  let editingSet = $state<RelaySet | null>(null);

  // Expanded set state - which set is showing its relays
  let expandedSetId = $state<string | null>(null);

  // Track which relays are currently enabled (for the active set)
  let enabledRelays = $state<Set<string>>(new Set());

  // Initialize enabled relays when active set changes
  $effect(() => {
    if (currentSet) {
      enabledRelays = new Set(currentSet.relays);
    } else {
      enabledRelays = new Set();
    }
  });

  // Get display text for the button
  let displayText = $derived.by(() => {
    if (isLoading) return "Loading...";
    if (currentSet) return currentSet.title;
    return "Default Relays";
  });

  // Handle relay set selection
  async function handleSelectSet(setId: string | null) {
    try {
      console.log(`[RelaySetSelector] User selected relay set: ${setId || "Default"}`);
      await setActiveRelaySet(setId, ndk);
      console.log("[RelaySetSelector] ✅ Relay set switched successfully");
      console.log("[RelaySetSelector] Current NDK pool relays:",
        Array.from(ndk.pool?.relays.keys() || [])
      );
    } catch (error) {
      console.error("[RelaySetSelector] ❌ Error selecting relay set:", error);
    }
  }

  // Toggle expand/collapse for a relay set
  function toggleExpand(e: Event, setId: string) {
    e.stopPropagation();
    expandedSetId = expandedSetId === setId ? null : setId;
  }

  // Handle individual relay toggle
  async function handleRelayToggle(relayUrl: string, enabled: boolean) {
    if (enabled) {
      enabledRelays.add(relayUrl);
    } else {
      enabledRelays.delete(relayUrl);
    }
    // Trigger reactivity
    enabledRelays = new Set(enabledRelays);

    // Update the NDK pool with the new relay configuration
    await updateActiveRelays();
  }

  // Invert all relay selections for a set
  async function handleInvertRelays(set: RelaySet) {
    const newEnabled = new Set<string>();
    for (const relayUrl of set.relays) {
      if (!enabledRelays.has(relayUrl)) {
        newEnabled.add(relayUrl);
      }
    }
    enabledRelays = newEnabled;
    await updateActiveRelays();
  }

  // Update active relays based on checkbox state
  async function updateActiveRelays() {
    const relays = Array.from(enabledRelays);
    console.log("[RelaySetSelector] Updating active relays:", relays);

    // Clear existing relays from NDK pool
    const currentRelays = Array.from(ndk.pool?.relays.values() || []);
    for (const relay of currentRelays) {
      try {
        relay.disconnect();
        ndk.pool?.removeRelay(relay.url);
      } catch (error) {
        console.warn(`[RelaySetSelector] Error removing relay ${relay.url}:`, error);
      }
    }

    // Update stores
    activeInboxRelays.set(relays);
    activeOutboxRelays.set(relays);

    // Add enabled relays to NDK pool
    for (const url of relays) {
      try {
        const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
        const protocol = isLocal ? "ws://" : "wss://";
        const normalizedUrl = url.startsWith("ws://") || url.startsWith("wss://")
          ? url
          : `${protocol}${url}`;

        const relay = new NDKRelay(normalizedUrl, NDKRelayAuthPolicies.signIn({ ndk }), ndk);
        relay.connect().catch((err) => {
          console.debug(`[RelaySetSelector] Relay ${normalizedUrl} connection deferred:`, err);
        });
        ndk.pool?.addRelay(relay);
      } catch (error) {
        console.warn(`[RelaySetSelector] Failed to add relay ${url}:`, error);
      }
    }

    // Signal that relays changed
    relaySwitchCounter.update((n) => n + 1);
    console.log("[RelaySetSelector] ✅ Active relays updated");
  }

  // Handle edit button click
  function handleEditSet(e: Event, set: RelaySet) {
    e.stopPropagation();
    editingSet = set;
    showEditModal = true;
  }

  // Handle create new set
  function handleCreateNew() {
    showCreateModal = true;
  }

  // Close edit modal and refresh if needed
  function closeEditModal() {
    // If the edited set was active, the changes are already applied via updateRelaySet
    // Just close the modal
    showEditModal = false;
    editingSet = null;
  }

  // Get short relay name for display (hostname + path)
  function getRelayDisplayName(url: string): string {
    try {
      const parsed = new URL(url);
      // Include path to distinguish relays on same domain
      const path = parsed.pathname !== "/" ? parsed.pathname : "";
      return parsed.hostname + path;
    } catch {
      return url.replace(/^wss?:\/\//, "");
    }
  }
</script>

{#if isSignedIn}
  <button
    id="relay-selector-button"
    class="btn-leather text-gray-900 dark:text-white"
    disabled={isLoading}
    aria-label="Select relay set"
  >
    <span class="hidden md:inline">
      {displayText}
    </span>
    <span class="md:hidden" title={displayText}>⚡</span>
  </button>

  <Dropdown
    triggeredBy="#relay-selector-button"
    placement="bottom-start"
    class="w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
  >
    <!-- Header -->
    <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
      <span class="text-sm font-semibold text-gray-900 dark:text-white">Relay Sets</span>
    </div>

    {#if relaySets.length === 0}
      <div class="px-4 py-3">
        <span class="text-gray-500 dark:text-gray-400 text-sm">No relay sets yet</span>
      </div>
    {:else}
      <div class="max-h-80 overflow-y-auto">
        {#each relaySets as set}
          <!-- Relay Set Header -->
          <div
            class="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer {activeSetId === set.id ? 'bg-primary-50 dark:bg-primary-900/30' : ''}"
            onclick={() => handleSelectSet(set.id)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectSet(set.id); } }}
            role="button"
            tabindex="0"
          >
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <!-- Expand/collapse button -->
              <button
                class="p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                onclick={(e) => toggleExpand(e, set.id)}
                title={expandedSetId === set.id ? "Collapse" : "Expand"}
              >
                {expandedSetId === set.id ? "▼" : "▶"}
              </button>
              {#if activeSetId === set.id}
                <span class="text-primary-600 dark:text-primary-400 flex-shrink-0">✓</span>
              {:else}
                <span class="w-4 flex-shrink-0"></span>
              {/if}
              <span class="text-gray-900 dark:text-white truncate">{set.title}</span>
              <span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                ({set.relays.length})
              </span>
            </div>
            <button
              class="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded"
              onclick={(e) => handleEditSet(e, set)}
              title="Edit relay set"
            >
              ✏️
            </button>
          </div>

          <!-- Expanded Relay List -->
          {#if expandedSetId === set.id}
            <div class="bg-gray-50 dark:bg-gray-900/50 border-t border-b border-gray-200 dark:border-gray-700">
              {#if activeSetId === set.id}
                <div class="flex items-center justify-end px-4 py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <button
                    class="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    onclick={(e) => { e.stopPropagation(); handleInvertRelays(set); }}
                  >
                    Invert Selection
                  </button>
                </div>
              {/if}
              {#each set.relays as relayUrl}
                <div
                  class="flex items-center gap-2 px-4 py-1.5 pl-10 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onclick={(e) => e.stopPropagation()}
                  onkeydown={(e) => e.stopPropagation()}
                  role="group"
                >
                  <input
                    type="checkbox"
                    checked={enabledRelays.has(relayUrl)}
                    onchange={(e) => {
                      const target = e.target as HTMLInputElement;
                      handleRelayToggle(relayUrl, target.checked);
                    }}
                    disabled={activeSetId !== set.id}
                    class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                  />
                  <span
                    class="text-sm truncate {activeSetId === set.id ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}"
                    title={relayUrl}
                  >
                    {getRelayDisplayName(relayUrl)}
                  </span>
                </div>
              {/each}
              {#if activeSetId !== set.id}
                <div class="px-4 py-1.5 pl-10 text-xs text-gray-400 dark:text-gray-500 italic">
                  Select this set to toggle relays
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}

    <DropdownDivider />

    <!-- Default Relays option -->
    <div
      class="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer {!activeSetId ? 'bg-primary-50 dark:bg-primary-900/30' : ''}"
      onclick={() => handleSelectSet(null)}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectSet(null); } }}
      role="button"
      tabindex="0"
    >
      {#if !activeSetId}
        <span class="text-primary-600 dark:text-primary-400">✓</span>
      {:else}
        <span class="w-4"></span>
      {/if}
      <span class="text-gray-900 dark:text-white">Default Relays</span>
    </div>

    <DropdownDivider />

    <!-- Create New & Manage -->
    <div class="px-2 py-2 space-y-1">
      <button
        class="w-full text-left px-2 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        onclick={handleCreateNew}
      >
        + Create New Set
      </button>
      <a
        href="/profile/relay-sets"
        class="block px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      >
        Manage All Sets...
      </a>
    </div>
  </Dropdown>

  <!-- Edit Modal -->
  {#if editingSet}
    <RelaySetEditModal
      bind:open={showEditModal}
      relaySet={editingSet}
      onClose={closeEditModal}
    />
  {/if}

  <!-- Create Modal -->
  <RelaySetCreateModal bind:open={showCreateModal} />
{/if}
