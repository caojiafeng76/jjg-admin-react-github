declare global {
  const EdgeRuntime: {
    waitUntil(promise: Promise<unknown>): void
  }
}

export {}
