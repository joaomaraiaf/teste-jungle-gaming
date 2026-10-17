// Bootstrap installs the mock boundary before any REST request or socket transport executes.
// Outside the browser bootstrap (including tests), the transport is already available.
let transportReady: Promise<void> = Promise.resolve();

export function setTransportReady(ready: Promise<void>) {
  transportReady = ready;
}

export function waitForTransport() {
  return transportReady;
}
