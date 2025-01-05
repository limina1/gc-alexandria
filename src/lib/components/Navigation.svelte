<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
  import {
    DarkMode,
    Navbar,
    NavLi,
    NavUl,
    NavHamburger,
    NavBrand,
    Toggle,
    Input,
    Label,
    Button,
  } from "flowbite-svelte";
  import { advancedMode, apiKey } from "$lib/stores";
  import Login from "./Login.svelte";
  import { fly } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  let className: string;
  export { className as class };

  let tempApiKey: string = "";

  function saveApiKey() {
    $apiKey = tempApiKey;
    tempApiKey = "";
  }
</script>

<Navbar class={`Navbar navbar-leather ${className}`}>
  <div class="flex flex-grow">
    <NavBrand href="/">
      <h1 class="font-serif">Alexandria</h1>
    </NavBrand>
  </div>
  <NavUl class="ul-leather flex-row justify-end">
    <NavLi href="/about">About</NavLi>
    <NavLi href="/new/edit">New Note</NavLi>
    <NavLi href="/visualize">Visualize</NavLi>
    <NavLi>
      <DarkMode btnClass="btn-leather p-0" />
    </NavLi>
  </NavUl>
  <div class="flex md:order-2 items-center ml-4">
    <Toggle bind:checked={$advancedMode} class="mr-3">Advanced</Toggle>
    <Login />
    <NavHamburger class="btn-leather" />
  </div>
</Navbar>
{#if $advancedMode}
  <div
    class="fixed right-0 top-[64px] h-auto w-80 bg-white dark:bg-gray-800 p-4 shadow-lg z-40 overflow-y-auto max-h [calc(100vh-64px)]"
    transition:fly={{ duration: 300, x: 320, opacity: 1, easing: quintOut }}
  >
    <div class="card">
      <h2 class="text-xl font-bold mb-4">Advanced Settings</h2>
      <Label for="apiKey" class="mb-2">API Key</Label>
      <Input
        id="apiKey"
        type="password"
        bind:value={tempApiKey}
        class="mb-4"
        placeholder="Enter your API key"
      />
      <Button on:click={saveApiKey} class="mb-4">Save API Key</Button>
      <p class="text-sm text-red-500 mt-2">
        Warning: Entering your API key here may pose security risks. Never share
        your key or use it on untrusted sites.
      </p>
    </div>
  </div>
{/if}
