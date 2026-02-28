import { useSyncExternalStore } from "react";

let pendingRequests = 0;
const subscribers = new Set<() => void>();

const notify = () => {
  subscribers.forEach((subscriber) => subscriber());
};

export const beginApiRequest = () => {
  pendingRequests += 1;
  notify();
};

export const endApiRequest = () => {
  pendingRequests = Math.max(0, pendingRequests - 1);
  notify();
};

const subscribe = (callback: () => void) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};

const getSnapshot = () => pendingRequests > 0;

export const useApiLoading = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
