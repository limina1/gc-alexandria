import { writable } from "svelte/store";
export const wikiKind = 30818;
export const indexKind = 30040;
export const zettelKinds = [30041];
export const standardRelays = [
  "wss://thecitadel.nostr1.com",
  "wss://relay.noswhere.com",
];
export const networkFetchLimit = writable(5);

export enum FeedType {
  Relays,
  Follows,
}
