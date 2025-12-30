<script lang="ts">
  import { Button } from "flowbite-svelte";
  import RelaySetList from "$lib/components/relay_sets/RelaySetList.svelte";
  import FavoriteRelaysSection from "$lib/components/relay_sets/FavoriteRelaysSection.svelte";
  import RelaySetCreateModal from "$lib/components/relay_sets/RelaySetCreateModal.svelte";
  import { userStore } from "$lib/stores/userStore";
  import { relaySetStore } from "$lib/stores/relaySetStore";

  let userState = $derived($userStore);
  let showCreateModal = $state(false);
  let relaySetsCount = $derived($relaySetStore.relaySets.length);
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
      Relay Set Management
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Create and manage collections of relays for different purposes
    </p>
  </div>

  {#if !userState.signedIn}
    <!-- Anonymous user message -->
    <div
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center"
    >
      <h2 class="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
        Sign In Required
      </h2>
      <p class="text-yellow-700 dark:text-yellow-300 mb-4">
        You must be signed in to create and manage relay sets.
      </p>
      <Button href="/start" color="yellow">Sign In</Button>
    </div>
  {:else}
    <!-- Signed in - show management interface -->
    <div class="space-y-8">
      <!-- Relay Sets Section -->
      <div>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Your Relay Sets
          </h2>
          <Button onclick={() => (showCreateModal = true)} color="primary">
            + Create New Set
          </Button>
        </div>

        {#if relaySetsCount === 0}
          <div
            class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center"
          >
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              You don't have any relay sets yet.
            </p>
            <Button onclick={() => (showCreateModal = true)} color="light">
              Create Your First Relay Set
            </Button>
          </div>
        {:else}
          <RelaySetList />
        {/if}
      </div>

      <!-- Favorite Relays Section -->
      <div>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Individual Favorite Relays
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Manage individual relays that aren't part of a set
        </p>
        <FavoriteRelaysSection />
      </div>
    </div>

    <!-- Create Modal -->
    <RelaySetCreateModal bind:open={showCreateModal} />
  {/if}
</div>
