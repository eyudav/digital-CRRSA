import { useSyncExternalStore } from "react";
import { store, subscribe } from "@/data/store";
export function useStore(selector) {
    return useSyncExternalStore((cb) => subscribe(cb), () => selector(store.all()), () => selector(store.all()));
}
