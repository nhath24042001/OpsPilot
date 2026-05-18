export type AcquiredLock = {
  key: string;
  token: string;
};

export interface DistributedLockPort {
  acquire(input: { key: string; ttlMs: number }): Promise<AcquiredLock | null>;
  release(lock: AcquiredLock): Promise<void>;
}
