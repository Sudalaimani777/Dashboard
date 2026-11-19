// client/src/features/travel/hooks/useFxRate.ts
import { useState, useEffect } from 'react';
import { travelApi } from '../services/travel.api';

const fxMemoryCache = new Map<string, number>();

export function useFxRate(currency: string = 'INR', expenseDate?: string) {
  const cur = (currency || 'INR').toUpperCase().trim();
  const dateKey = expenseDate && /^\d{4}-\d{2}-\d{2}$/.test(expenseDate)
    ? expenseDate
    : new Date().toISOString().split('T')[0];
  const cacheKey = `${cur}_INR_${dateKey}`;

  const [rate, setRate] = useState<number>(() => {
    if (cur === 'INR') return 1.0;
    return fxMemoryCache.get(cacheKey) || 1.0;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cur === 'INR') {
      setRate(1.0);
      setLoading(false);
      setError(null);
      return;
    }

    if (fxMemoryCache.has(cacheKey)) {
      setRate(fxMemoryCache.get(cacheKey)!);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await travelApi.getFxRate(cur, dateKey);
        if (active && data && typeof data.rate === 'number') {
          fxMemoryCache.set(cacheKey, data.rate);
          setRate(data.rate);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'FX lookup failed');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [cur, dateKey, cacheKey]);

  return { rate, loading, error };
}
