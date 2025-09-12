// runtime/block.ts

// Where to mount in the real DOM
export type MountPoint = { parent: Node; anchor?: Node | null };

// One renderable unit
export interface Block {
  /** mount */
  m(target: MountPoint): void;
  /** patch/update; 'dirty' is a bitmask (or 0 when nothing relevant changed) */
  p(dirty: DirtyMask, state: any): void;
  /** destroy and cleanup */
  d(): void;
}

/**
 * Keep this as 'number' for now.
 * If you outgrow 31 bits later, you can change this to `ReadonlyArray<number>`
 * (Svelte does this) without touching generator call sites—just plumb it through.
 */
export type DirtyMask = number;

/** Generic disposer for listeners/timeouts/etc. */
export type Unsubscriber = () => void;

/** Optional local scope type for each/if child factories */
export type Locals = Record<string, unknown>;
