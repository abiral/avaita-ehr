export interface IdleDetector {
  /** Calls `fn` on user activity (pointer, key, touch). Returns a stop function. */
  onActivity(fn: () => void): () => void
}
