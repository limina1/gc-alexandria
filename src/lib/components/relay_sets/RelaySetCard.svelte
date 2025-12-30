<script lang="ts">
  import { Button, Card, Badge } from "flowbite-svelte";
  import RelayDisplay from "$lib/components/RelayDisplay.svelte";
  import { setActiveRelaySet, deleteRelaySet } from "$lib/stores/relaySetStore";
  import { testRelayConnection, getNdkContext } from "$lib/ndk";
  import type { RelaySet } from "$lib/utils/relay_set_management";

  let {
    relaySet,
    isActive = false,
    onEdit = () => {},
  } = $props<{
    relaySet: RelaySet;
    isActive?: boolean;
    onEdit?: (relaySet: RelaySet) => void;
  }>();

  const ndk = getNdkContext();

  let isExpanded = $state(false);
  let testingResults = $state<Record<string, "connected" | "disconnected" | "pending">>({});
  let isTesting = $state(false);
  let isDeleting = $state(false);

  async function handleSetActive() {
    try {
      await setActiveRelaySet(relaySet.id, ndk);
    } catch (error) {
      console.error("Error setting active relay set:", error);
    }
  }

  async function handleTestAll() {
    if (isTesting) return;

    isTesting = true;
    testingResults = {};

    // Test each relay
    for (const relay of relaySet.relays) {
      testingResults[relay] = "pending";

      try {
        const result = await testRelayConnection(relay, ndk);
        testingResults[relay] = result.connected ? "connected" : "disconnected";
      } catch (error) {
        console.error(`Error testing relay ${relay}:`, error);
        testingResults[relay] = "disconnected";
      }
    }

    isTesting = false;
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete the relay set "${relaySet.title}"?`)) {
      return;
    }

    isDeleting = true;
    try {
      await deleteRelaySet(relaySet.id, ndk);
    } catch (error) {
      console.error("Error deleting relay set:", error);
      alert(`Failed to delete relay set: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      isDeleting = false;
    }
  }

  function getStatusColor(status: "connected" | "disconnected" | "pending" | undefined): "green" | "red" | "yellow" | "gray" {
    if (!status) return "gray";
    switch (status) {
      case "connected":
        return "green";
      case "disconnected":
        return "red";
      case "pending":
        return "yellow";
      default:
        return "gray";
    }
  }
</script>

<Card
  class={`${isActive ? "border-2 border-primary-500 dark:border-primary-400" : ""} mb-4 bg-white dark:bg-gray-800`}
>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            {relaySet.title}
          </h3>
          {#if isActive}
            <Badge color="green">Active</Badge>
          {/if}
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {relaySet.relays.length}
          {relaySet.relays.length === 1 ? "relay" : "relays"}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <Button
          onclick={() => (isExpanded = !isExpanded)}
          color="light"
          size="sm"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </Button>
        {#if !isActive}
          <Button onclick={handleSetActive} color="primary" size="sm">
            Set Active
          </Button>
        {/if}
        <Button onclick={() => onEdit(relaySet)} color="light" size="sm">
          Edit
        </Button>
        <Button
          onclick={handleDelete}
          disabled={isDeleting}
          color="red"
          size="sm"
          title="Delete relay set"
        >
          {isDeleting ? "..." : "🗑️"}
        </Button>
      </div>
    </div>

    <!-- Expanded Content -->
    {#if isExpanded}
      <div class="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <!-- Action Buttons -->
        <div class="flex gap-2 flex-wrap">
          <Button
            onclick={handleTestAll}
            disabled={isTesting}
            color="light"
            size="sm"
          >
            {isTesting ? "Testing..." : "Test All Relays"}
          </Button>
        </div>

        <!-- Relay List -->
        <div class="space-y-2">
          <h4 class="font-medium text-gray-700 dark:text-gray-300">Relays:</h4>
          {#each relaySet.relays as relay}
            <div class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <RelayDisplay
                relay={relay}
                showStatus={false}
              />
              {#if testingResults[relay]}
                <Badge color={getStatusColor(testingResults[relay])} class="text-xs">
                  {testingResults[relay]}
                </Badge>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</Card>
