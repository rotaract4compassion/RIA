// IndexedDB wrapper for offline storage
import { openDB } from 'idb';

const DB_NAME = 'ria-offline';
const DB_VERSION = 1;

let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Pending submissions queue
        if (!db.objectStoreNames.contains('submission_queue')) {
          const store = db.createObjectStore('submission_queue', { keyPath: 'local_id' });
          store.createIndex('by_project', 'project_id');
          store.createIndex('by_synced', 'synced');
        }
        // Form drafts
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'key' });
        }
        // Cached questionnaires
        if (!db.objectStoreNames.contains('questionnaires')) {
          db.createObjectStore('questionnaires', { keyPath: 'project_id' });
        }
        // Cached projects
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        // App state / tokens
        if (!db.objectStoreNames.contains('app_state')) {
          db.createObjectStore('app_state', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export const offlineDb = {
  // Submission queue
  async queueSubmission(submission) {
    const db = await getDb();
    const entry = {
      ...submission,
      local_id: submission.local_id || `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      queued_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      synced: false,
      hidden_at: null, // will be set 30 min after submission
    };
    await db.put('submission_queue', entry);
    return entry;
  },

  async getPendingSubmissions() {
    const db = await getDb();
    const all = await db.getAll('submission_queue');
    return all.filter(s => !s.synced);
  },

  async markSynced(local_id, server_id) {
    const db = await getDb();
    const entry = await db.get('submission_queue', local_id);
    if (entry) {
      await db.put('submission_queue', { ...entry, synced: true, server_id, synced_at: new Date().toISOString() });
      // Delete right away since it's synced
      await db.delete('submission_queue', local_id);
    }
  },

  async applyVisibilityRule() {
    // Hide submissions submitted >30 minutes ago
    const db = await getDb();
    const cutoff = Date.now() - 30 * 60 * 1000;
    const all = await db.getAll('submission_queue');
    for (const s of all) {
      const submittedAt = new Date(s.submitted_at).getTime();
      if (submittedAt < cutoff && !s.hidden_at) {
        if (s.synced) {
          await db.delete('submission_queue', s.local_id);
        } else {
          await db.put('submission_queue', { ...s, hidden_at: new Date().toISOString() });
        }
      }
    }
  },

  async getVisibleSubmissions(project_id) {
    await this.applyVisibilityRule();
    const db = await getDb();
    const all = await db.getAll('submission_queue');
    return all.filter(s => s.project_id === project_id && !s.hidden_at);
  },

  // Drafts
  async saveDraft(key, data) {
    const db = await getDb();
    await db.put('drafts', { key, data, saved_at: new Date().toISOString() });
  },

  async getDraft(key) {
    const db = await getDb();
    const entry = await db.get('drafts', key);
    return entry?.data;
  },

  async deleteDraft(key) {
    const db = await getDb();
    await db.delete('drafts', key);
  },

  // Questionnaires
  async cacheQuestionnaire(project_id, schema) {
    const db = await getDb();
    await db.put('questionnaires', { project_id, schema, cached_at: new Date().toISOString() });
  },

  async getCachedQuestionnaire(project_id) {
    const db = await getDb();
    return db.get('questionnaires', project_id);
  },

  // Projects
  async cacheProjects(projects) {
    const db = await getDb();
    const tx = db.transaction('projects', 'readwrite');
    for (const p of projects) await tx.store.put(p);
    await tx.done;
  },

  async getCachedProjects() {
    const db = await getDb();
    return db.getAll('projects');
  },

  // App state
  async setState(key, value) {
    const db = await getDb();
    await db.put('app_state', { key, value });
  },

  async getState(key) {
    const db = await getDb();
    const entry = await db.get('app_state', key);
    return entry?.value;
  },
};

export default offlineDb;
