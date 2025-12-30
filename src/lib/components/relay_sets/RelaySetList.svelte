<script lang="ts">
  import RelaySetCard from "./RelaySetCard.svelte";
  import RelaySetEditModal from "./RelaySetEditModal.svelte";
  import { relaySetStore } from "$lib/stores/relaySetStore";
  import type { RelaySet } from "$lib/utils/relay_set_management";

  let relaySets = $derived($relaySetStore.relaySets);
  let activeSetId = $derived($relaySetStore.activeSetId);

  let editingSet = $state<RelaySet | null>(null);
  let showEditModal = $state(false);

  function handleEdit(relaySet: RelaySet) {
    editingSet = relaySet;
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    editingSet = null;
  }
</script>

<div class="space-y-4">
  {#each relaySets as relaySet (relaySet.id)}
    <RelaySetCard
      {relaySet}
      isActive={relaySet.id === activeSetId}
      onEdit={handleEdit}
    />
  {/each}
</div>

{#if editingSet}
  <RelaySetEditModal
    bind:open={showEditModal}
    relaySet={editingSet}
    onClose={closeEditModal}
  />
{/if}
