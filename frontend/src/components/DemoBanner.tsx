import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { HealthInfo } from '../types';
import { healthApi } from '../services/api';

let cached: HealthInfo | null = null;
let inflight: Promise<HealthInfo> | null = null;

export function useHealth() {
  const [health, setHealth] = useState<HealthInfo | null>(cached);
  useEffect(() => {
    if (cached && cached.status) return;
    if (!inflight) {
      inflight = healthApi.get().catch(() => {
        inflight = null;
        throw new Error('unavailable');
      });
    }
    inflight
      .then((info) => {
        cached = info;
        setHealth(info);
      })
      .catch(() => setHealth(null));
  }, []);
  return health;
}

export function DemoBanner() {
  const health = useHealth();
  const [hidden, setHidden] = useState(false);
  if (!health?.demoMode || hidden) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-900">
      <div className="mx-auto flex max-w-7xl items-start gap-2 text-xs sm:text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="flex-1">
          <strong className="font-semibold">Demo mode.</strong> {health.notice}{' '}
          {health.uploadMode === 'local-demo'
            ? 'Uploaded images are stored in local demo storage and are not permanent.'
            : ''}
        </p>
        <button onClick={() => setHidden(true)} aria-label="Dismiss demo notice" className="text-amber-700 hover:text-amber-900">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
