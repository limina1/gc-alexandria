<script lang="ts">
  import { Modal, Button, Input, Label, Helper } from "flowbite-svelte";
  import { createRelaySet } from "$lib/stores/relaySetStore";
  import { getNdkContext } from "$lib/ndk";
  import { normalizeRelayUrl } from "$lib/utils/relay_management";

  let { open = $bindable(false) } = $props<{ open: boolean }>();

  const ndk = getNdkContext();

  let title = $state("");
  let relayUrls = $state<string[]>([""]);
  let error = $state<string | null>(null);
  let isSubmitting = $state(false);

  function addRelayInput() {
    relayUrls = [...relayUrls, ""];
  }

  function removeRelayInput(index: number) {
    if (relayUrls.length > 1) {
      relayUrls = relayUrls.filter((_, i) => i !== index);
    }
  }

  function updateRelayUrl(index: number, value: string) {
    relayUrls = relayUrls.map((url, i) => (i === index ? value : url));
  }

  async function handleSubmit() {
    error = null;

    // Validate title
    if (!title.trim()) {
      error = "Title is required";
      return;
    }

    if (title.length > 100) {
      error = "Title must be 100 characters or less";
      return;
    }

    // Validate and normalize relay URLs
    const validRelays = relayUrls
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
      .map((url) => {
        try {
          return normalizeRelayUrl(url);
        } catch (e) {
          console.warn(`Invalid relay URL: ${url}`);
          return null;
        }
      })
      .filter((url): url is string => url !== null && url.length > 0);

    if (validRelays.length === 0) {
      error = "At least one valid relay URL is required";
      return;
    }

    // Check for invalid URLs
    const invalidUrls = validRelays.filter(
      (url) => !url.startsWith("wss://") && !url.startsWith("ws://"),
    );
    if (invalidUrls.length > 0) {
      error = `Invalid relay URLs (must start with wss:// or ws://): ${invalidUrls.join(", ")}`;
      return;
    }

    isSubmitting = true;
    try {
      await createRelaySet(title, validRelays, ndk);

      // Reset form
      title = "";
      relayUrls = [""];
      error = null;
      open = false;
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to create relay set";
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    // Reset form
    title = "";
    relayUrls = [""];
    error = null;
    open = false;
  }
</script>

<Modal bind:open title="Create New Relay Set" size="lg">
  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
    <!-- Title Input -->
    <div>
      <Label for="title" class="mb-2">Title</Label>
      <Input
        id="title"
        bind:value={title}
        placeholder="e.g., Bitcoin Relays, Lightning Network, General Purpose"
        required
        maxlength={100}
      />
      <Helper class="text-xs mt-1">
        A descriptive name for this relay set ({title.length}/100)
      </Helper>
    </div>

    <!-- Relay URLs -->
    <div>
      <Label class="mb-2">Relay URLs</Label>
      <div class="space-y-2">
        {#each relayUrls as url, i}
          <div class="flex gap-2">
            <Input
              value={url}
              oninput={(e) => {
                const target = e.target as HTMLInputElement;
                updateRelayUrl(i, target.value);
              }}
              placeholder="wss://relay.example.com"
              class="flex-1"
              type="url"
            />
            {#if relayUrls.length > 1}
              <Button
                onclick={() => removeRelayInput(i)}
                color="red"
                size="sm"
                type="button"
              >
                ✕
              </Button>
            {/if}
          </div>
        {/each}
      </div>

      <Button
        onclick={addRelayInput}
        color="light"
        size="sm"
        class="mt-2"
        type="button"
      >
        + Add Relay
      </Button>

      <Helper class="text-xs mt-1">
        Enter relay WebSocket URLs (wss:// or ws:// for local relays)
      </Helper>
    </div>

    <!-- Error Message -->
    {#if error}
      <div
        class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm"
      >
        {error}
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex gap-2 justify-end pt-4">
      <Button onclick={handleCancel} color="alternative" type="button">
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting} color="primary">
        {isSubmitting ? "Creating..." : "Create Relay Set"}
      </Button>
    </div>
  </form>
</Modal>
