<script lang="ts">
  import "../app.css";
  import Navigation from "$lib/components/Navigation.svelte";
  import { onMount } from "svelte";
  import { advancedMode, apiKey } from "$lib/stores";
  import ChatInterface from "$lib/components/ChatInterface.svelte";
  import { page } from "$app/stores";

  $: displayHeight = window.innerHeight;
  $: isPublicationPage = $page.url.pathname.startsWith("/publication");

  onMount(() => {
    document.body.style.height = `${displayHeight}px`;
  });
</script>

<div class={"leather min-h-full w-full flex flex-col items-center"}>
  <Navigation class="sticky top-0" />
  <slot />
  {#if $apiKey && $advancedMode && !isPublicationPage}
    <ChatInterface isPublicationView={false} />
  {/if}
</div>
