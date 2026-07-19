// Background sync engine
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
    // Dispatch custom event so BottomNav can update its badge without polling
    window.dispatchEvent(new CustomEvent('broadcasts-updated', { detail: data }));
  } catch {
    // Non-fatal — offline or server down
  }
}

export async function syncPendingSubmissions() {
  if (syncInProgress || !navigator.onLine) return;

  // Also refresh broadcasts on every check-in (piggybacked on sync cycle)
  refreshBroadcasts();

  const pending = await offlineDb.getPendingSubmissions();
  if (!pending.length) return;

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
    // Apply 30-minute visibility rule
    await offlineDb.applyVisibilityRule();
  }
}

// Start background sync engine
export function startSyncEngine() {
  // Sync on connectivity restored
  window.addEventListener('online', () => {
    setTimeout(syncPendingSubmissions, 1000);
    setTimeout(refreshBroadcasts, 3000);
  });

  // Periodic retry every 5 minutes
  setInterval(() => {
    if (navigator.onLine) syncPendingSubmissions();
  }, 5 * 60 * 1000);

  // Refresh broadcast count every 5 minutes independently
  setInterval(() => {
    if (navigator.onLine) refreshBroadcasts();
  }, 5 * 60 * 1000);

  // Apply visibility rule every 5 minutes
  setInterval(() => {
    offlineDb.applyVisibilityRule();
  }, 5 * 60 * 1000);

  // Initial sync + broadcast fetch on load
  if (navigator.onLine) {
    setTimeout(syncPendingSubmissions, 2000);
    setTimeout(refreshBroadcasts, 4000);
  }
}

export function getSyncStatus() {
  return syncInProgress ? 'syncing' : navigator.onLine ? 'online' : 'offline';
}
