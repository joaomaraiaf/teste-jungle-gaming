/** Capture before bootstrap creates storage. Existing users/scenarios must always read live state. */
export function canUsePublicSnapshot() {
  try {
    return ![
      localStorage.getItem('greenmint:mocks:v1'),
      localStorage.getItem('kurio:mock-commerce:v1'),
      sessionStorage.getItem('kurio:mock-network:v1'),
      sessionStorage.getItem('kurio:mock-session:v1'),
    ].some(Boolean);
  } catch {
    return false;
  }
}
