<script lang="ts">
  import { Button, Input, Card } from "flowbite-svelte";
  import RelayDisplay from "$lib/components/RelayDisplay.svelte";
  import {
    relaySetStore,
    addToFavorites,
    removeFromFavorites,
  } from "$lib/stores/relaySetStore";
  import { getNdkContext } from "$lib/ndk";
  import { normalizeRelayUrl } from "$lib/utils/relay_management";

  const ndk = getNdkContext();

  let favoriteRelays = $derived($relaySetStore.favoriteRelays);
  let newRelayUrl = $state("");
  let error = $state<string | null>(null);
  let isAdding = $state(false);

  async function handleAddRelay() {
    error = null;

    if (!newRelayUrl.trim()) {
      error = "Please enter a relay URL";
      return;
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeRelayUrl(newRelayUrl.trim());
    } catch (e) {
      error = "Invalid relay URL format";
      return;
    }

    if (!normalizedUrl.startsWith("wss://") && !normalizedUrl.startsWith("ws://")) {
      error = "Relay URL must start with wss:// or ws://";
      return;
    }

    if (favoriteRelays.includes(normalizedUrl)) {
      error = "This relay is already in your favorites";
      return;
    }

    isAdding = true;
    try {
      await addToFavorites(normalizedUrl, ndk);
      newRelayUrl = "";
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to add relay to favorites";
    } finally {
      isAdding = false;
    }
  }

  async function handleRemoveRelay(relayUrl: string) {
    try {
      await removeFromFavorites(relayUrl, ndk);
    } catch (e) {
      console.error("Failed to remove relay from favorites:", e);
    }
  }
</script>

<Card>
  <div class="space-y-4">
    <!-- Add Relay Form -->
    <div>
      <form onsubmit={(e) => { e.preventDefault(); handleAddRelay(); }} class="flex gap-2">
        <Input
          bind:value={newRelayUrl}
          placeholder="wss://relay.example.com"
          class="flex-1"
          type="url"
        />
        <Button type="submit" disabled={isAdding} color="primary">
          {isAdding ? "Adding..." : "Add Relay"}
        </Button>
      </form>

      {#if error}
        <p class="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
      {/if}
    </div>

    <!-- Favorites List -->
    {#if favoriteRelays.length === 0}
      <div class="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No individual favorite relays yet.</p>
        <p class="text-sm mt-1">
          Add relays here that you want to use when no relay set is active.
        </p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each favoriteRelays as relay}
          <div
            class="flex items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded"
          >
            <RelayDisplay relay={relay} showStatus={false} />
            <Button
              onclick={() => handleRemoveRelay(relay)}
              color="red"
              size="sm"
            >
              Remove
            </Button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Card>
