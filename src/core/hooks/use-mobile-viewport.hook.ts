import { useSyncExternalStore } from 'react';

const query = '(max-width: 767px)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const getSnapshot = () => window.matchMedia(query).matches;
let serverMobile = false;
export function setServerMobile(value: boolean) {
  serverMobile = value;
}
const getServerSnapshot = () => (typeof window === 'undefined' ? serverMobile : getSnapshot());

export function useMobileViewport() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
