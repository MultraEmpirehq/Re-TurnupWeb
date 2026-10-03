import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true once rendering in the browser. Use
 * it for output that depends on the browser (local time, storage) so the first
 * client render matches the server HTML.
 */
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

export default useIsClient;
