export const SIGNOUT_KEY = "mitooni:account:explicit-signout:v1";
const CHANNEL = "mitooni-account-signout-v1";
export function signoutBus(onPeer: () => void, host: Window = window) {
  let storage: Storage | null = null;
  try {
    storage = host.localStorage;
    const probe = "mitooni:account:storage-probe:v1";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
  } catch {
    storage = null;
  }
  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== "undefined")
      channel = new BroadcastChannel(CHANNEL);
  } catch {
    /* Storage events provide the fallback. */
  }
  const receive = (e: StorageEvent) => {
    if (
      e.key === SIGNOUT_KEY &&
      e.newValue !== null &&
      e.storageArea === storage
    )
      onPeer();
  };
  host.addEventListener("storage", receive);
  if (channel)
    channel.onmessage = (e) => {
      if (e.data?.type === "signed-out") onPeer();
    };
  return {
    storage,
    available: !!storage || !!channel,
    publish: () => channel?.postMessage({ type: "signed-out" }),
    close: () => {
      host.removeEventListener("storage", receive);
      channel?.close();
    },
  };
}
