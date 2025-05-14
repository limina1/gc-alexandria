export const wikiKind = 30818;
export const indexKind = 30040;
export const zettelKinds = [30041, 30818];
export const standardRelays = ["wss://medschlr.nostr1.com"];
export const bootstrapRelays = ["wss://medschlr.nostr1.com"];

export enum FeedType {
  StandardRelays = "standard",
  UserRelays = "user",
}

export const loginStorageKey = "alexandria/login/pubkey";
export const feedTypeStorageKey = "alexandria/feed/type";
