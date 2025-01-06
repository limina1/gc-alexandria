// src/lib/stores/apiKey.ts
import { writable } from "svelte/store";

// Initialize from localStorage if available
const storedKey =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("anthropic_api_key")
    : null;

export const apiKey = writable<string>(storedKey || "");

// Subscribe to changes and update localStorage
apiKey.subscribe((value) => {
  if (typeof localStorage !== "undefined" && value) {
    localStorage.setItem("anthropic_api_key", value);
  }
});
