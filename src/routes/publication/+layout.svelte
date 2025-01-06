<script lang="ts">
  import { advancedMode } from "$lib/stores";
  import ChatInterface from "$lib/components/ChatInterface.svelte";
  import { page } from "$app/stores";

  export let data;
  let isChatVisible = false;
</script>

{#if $advancedMode}
  <ChatInterface
    bind:isVisible={isChatVisible}
    events={data?.events || []}
    isPublicationView={true}
  />
{/if}

<slot />
