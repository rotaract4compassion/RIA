// Action-based sync engine — no polling, free-tier friendly
import { offlineDb } from './db';
import api from './api';

let syncInProgress = false;
let syncListeners = [];

export function onSyncStatusChange(fn) {
  syncListeners.push(fn);
  return () => { syncListeners = syncListeners.filter(l => l !== fn); };
}

function emit(status) {
  syncListeners.forEach(fn => fn(status));
}

// Fetch latest broadcasts and cache unread count in localStorage (lightweight)
async function refreshBroadcasts() {
  if (!navigator.onLine) return;
  try {
    const data = await api.get('/broadcasts/unread-count');
    localStorage.setItem('ria_unread_broadcasts', String(data.count || 0));
    window.dispatchEvent(new CustomEvent('broadcasts-updated', { detail: data }));
  } catch {
    // Non-fatal — offline or server down
  }
}

export async function syncPendingSubmissions() {
  if (syncInProgress || !navigator.onLine) return;

  const pending = await offlineDb.getPendingSubmissions();
  if (!pending.length) {
    // Still refresh broadcasts since we're online and an action happened
    refreshBroadcasts();
    return;
  }

  syncInProgress = true;
  emit('syncing');

  try {
    const res = await api.post('/submissions/batch', { submissions: pending });
    for (const result of res.results) {
      if (!result.error) {
        await offlineDb.markSynced(result.local_id, result.id);
      }
    }
    localStorage.setItem('ria_last_sync', new Date().toISOString());
    emit('synced');
  } catch (err) {
    console.error('Sync failed:', err.message);
    emit('failed');
  } finally {
    syncInProgress = false;
    await offlineDb.applyVisibilityRule();
    // Piggyback a broadcast refresh after sync
    refreshBroadcasts();
  }
}

// Manual refresh — call from UI refresh button
export async function manualRefresh() {
  emit('syncing');
  try {
    // Sync any pending submissions first
    await syncPendingSubmissions();
    // Always refresh broadcasts on manual action
    await refreshBroadcasts();
    // Apply visibility cleanup
    await offlineDb.applyVisibilityRule();
    emit('synced');
  } catch {
    emit('failed');
  }
}

// Start sync engine — action-based only, no intervals
export function startSyncEngine() {
  // Sync when connectivity is restored
  window.addEventListener('online', () => {
    setTimeout(syncPendingSubmissions, 1000);
  });

  // Initial sync + broadcast fetch on load (one-time)
  if (navigator.onLine) {
    setTimeout(syncPendingSubmissions, 2000);
  }
}

export function getSyncStatus() {
  return syncInProgress ? 'syncing' : navigator.onLine ? 'online' : 'offline';
}
