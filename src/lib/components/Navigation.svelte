<script lang="ts">
  import {
    DarkMode,
    Navbar,
    NavLi,
    NavUl,
    NavHamburger,
    NavBrand,
  } from "flowbite-svelte";
  import Profile from "./util/Profile.svelte";
  import { userStore } from "$lib/stores/userStore";

  let { class: className = "" } = $props();

  let userState = $derived($userStore);
</script>

<Navbar class={`Navbar navbar-leather navbar-main ${className}`}>
  <div class="flex flex-grow justify-between">
    <NavBrand href="/">
      <div class="flex items-center gap-2">
        <img src="/medschlr_profile.jpg" alt="MedSchlr Tree Logo" class="h-8 w-8 rounded" />
        <h1 class="text-2xl font-bold">MedSchlr</h1>
      </div>
    </NavBrand>
  </div>
  <div class="flex md:order-2">
    <Profile isNav={true} />
    <NavHamburger class="btn-leather" />
  </div>
  <NavUl class="ul-leather">
    <NavLi href="/">Publications</NavLi>
    <NavLi href="/new/compose">Compose</NavLi>
    <NavLi href="/visualize">Visualize</NavLi>
    <NavLi href="/start">Getting Started</NavLi>
    <NavLi href="/events">Events</NavLi>
    {#if userState.signedIn}
      <NavLi href="/my-notes">My Notes</NavLi>
    {/if}
    <NavLi href="/about">About</NavLi>
    <NavLi href="/contact">Contact</NavLi>
    <NavLi>
      <DarkMode btnClass="btn-leather p-0" />
    </NavLi>
  </NavUl>
</Navbar>
