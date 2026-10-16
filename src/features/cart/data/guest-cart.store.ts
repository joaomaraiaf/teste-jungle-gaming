const KEY = 'kurio:guest-cart-id:v1';
let fallback: string | undefined;
export function getGuestCartId(renew = false): string {
  try {
    const stored = window.sessionStorage.getItem(KEY);
    if (!renew && stored && /^[\da-f-]{36}$/i.test(stored)) return stored;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem(KEY, id);
    fallback = id;
    return id;
  } catch {
    if (renew || !fallback) fallback = crypto.randomUUID();
    return fallback;
  }
}
