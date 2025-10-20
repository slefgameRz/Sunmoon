type MessagePayload =
  | { type: "CACHE_TILE"; tileId: string }
  | { type: "PING" }
  | { type: "SKIP_WAITING" }

export function postToServiceWorker(message: MessagePayload) {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage(message)
}

export function addServiceWorkerListener(
  handler: (event: MessageEvent) => void,
): () => void {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return () => undefined

  navigator.serviceWorker.addEventListener("message", handler)
  return () => navigator.serviceWorker.removeEventListener("message", handler)
}
