/**
 * Utilities for storing and retrieving epoch snapshot data
 * This is necessary because the smart contract only stores the Merkle root,
 * not the individual balances that were used to create it.
 */

export interface EpochSnapshot {
  epochId: string;
  addresses: string[];
  balances: string[]; // stored as strings to avoid BigInt serialization issues
  balanceRoot: string;
  timestamp: number;
  chainId: number;
}

const STORAGE_KEY_PREFIX = 'epoch_snapshot_';

/**
 * Save an epoch snapshot to localStorage
 */
export function saveEpochSnapshot(snapshot: EpochSnapshot): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${snapshot.chainId}_${snapshot.epochId}`;
    localStorage.setItem(key, JSON.stringify(snapshot));
    console.log(`Saved snapshot for epoch ${snapshot.epochId} on chain ${snapshot.chainId}`);
  } catch (error) {
    console.error('Failed to save epoch snapshot:', error);
  }
}

/**
 * Get an epoch snapshot from localStorage
 */
export function getEpochSnapshot(chainId: number, epochId: string): EpochSnapshot | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${chainId}_${epochId}`;
    const data = localStorage.getItem(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as EpochSnapshot;
  } catch (error) {
    console.error('Failed to retrieve epoch snapshot:', error);
    return null;
  }
}

/**
 * Get all stored snapshots for a chain
 */
export function getAllSnapshots(chainId: number): EpochSnapshot[] {
  const snapshots: EpochSnapshot[] = [];
  try {
    const prefix = `${STORAGE_KEY_PREFIX}${chainId}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const data = localStorage.getItem(key);
        if (data) {
          snapshots.push(JSON.parse(data));
        }
      }
    }
  } catch (error) {
    console.error('Failed to retrieve snapshots:', error);
  }
  return snapshots.sort((a, b) => parseInt(a.epochId) - parseInt(b.epochId));
}

/**
 * Clear all snapshots for a chain (useful for testing)
 */
export function clearSnapshots(chainId: number): void {
  try {
    const prefix = `${STORAGE_KEY_PREFIX}${chainId}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} snapshots for chain ${chainId}`);
  } catch (error) {
    console.error('Failed to clear snapshots:', error);
  }
}
