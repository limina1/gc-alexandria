import { readable, writable } from "svelte/store";
import { FeedType } from "./consts";

// Initialize from localStorage if available
export let idList = writable<string[]>([]);

export let alexandriaKinds = readable<number[]>([30040, 30041]);

export let feedType = writable<FeedType>(FeedType.Relays);

export let advancedMode = writable<boolean>(false);

export let apiKey = writable<string>("");
