import React, { useState, useEffect } from 'react';
import { onSyncStatusChange } from '../lib/sync';
import { t } from '../lib/i18n';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const unsub = onSyncStatusChange(setSyncStatus);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, []);

  if (online && syncStatus !== 'syncing') return null;

  return (
    <div className={`offline-banner ${syncStatus === 'syncing' ? 'bg-gold' : 'bg-gray-500'}`}>
      {syncStatus === 'syncing' ? (
        <span className="flex items-center justify-center gap-1.5">
          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full spinner" />
          {t('syncing')}
        </span>
      ) : (
        t('offline')
      )}
    </div>
  );
}
