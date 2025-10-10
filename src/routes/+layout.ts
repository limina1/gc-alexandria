import type { LayoutLoad } from "./$types";
import { initNdk } from "$lib/ndk";
import { browser } from "$app/environment";

export const load: LayoutLoad = () => {
  // Only initialize NDK on the client side
  if (browser) {
    return {
      ndk: initNdk(),
    };
  }

  // Return empty object on server
  return {
    ndk: null,
  };
}
