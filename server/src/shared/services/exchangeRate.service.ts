// server/src/shared/services/exchangeRate.service.ts
import { pool } from '../db/pool.js';
import { config } from '../../config/env.js';

export interface FxRateResult {
  from: string;
  to: string;
  date: string;
  rate: number;
  source: 'IDENTITY' | 'DB_CACHE' | 'UPSTREAM_API' | 'FALLBACK';
}

export class ExchangeRateService {
  private static get PRIMARY_BASE(): string {
    return config.currency.primary;
  }

  private static get FALLBACK_BASE(): string {
    return config.currency.fallback;
  }
  
  public static readonly ALLOWED_CURRENCIES = new Set([
    'INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'THB', 'MYR'
  ]);

  static async getRate(fromCurrency: string, expenseDate?: string): Promise<FxRateResult> {
    const from = (fromCurrency || '').toUpperCase().trim();
    if (!this.ALLOWED_CURRENCIES.has(from)) {
      throw new Error(`Unsupported or invalid currency code: ${from}`);
    }

    // Same-currency identity
    if (from === 'INR') {
      return {
        from: 'INR',
        to: 'INR',
        date: expenseDate || new Date().toISOString().split('T')[0],
        rate: 1.0,
        source: 'IDENTITY'
      };
    }

    const targetDate = expenseDate && /^\d{4}-\d{2}-\d{2}$/.test(expenseDate)
      ? expenseDate
      : new Date().toISOString().split('T')[0];

    // 1. Check PostgreSQL cache
    const cacheRes = await pool.query(
      `SELECT rate FROM exchange_rates 
       WHERE from_currency = $1 AND to_currency = 'INR' AND rate_date = $2`,
      [from, targetDate]
    );

    if (cacheRes.rowCount && cacheRes.rowCount > 0) {
      return {
        from,
        to: 'INR',
        date: targetDate,
        rate: parseFloat(cacheRes.rows[0].rate),
        source: 'DB_CACHE'
      };
    }

    // 2. Fetch from Upstream API
    const rate = await this.fetchRateFromUpstream(from, targetDate);

    // 3. Save to Cache
    try {
      await pool.query(
        `INSERT INTO exchange_rates (from_currency, to_currency, rate_date, rate)
         VALUES ($1, 'INR', $2, $3)
         ON CONFLICT (from_currency, to_currency, rate_date) 
         DO UPDATE SET rate = EXCLUDED.rate`,
        [from, targetDate, rate]
      );
    } catch (dbErr) {
      console.warn('Failed to cache exchange rate to database:', dbErr);
    }

    return {
      from,
      to: 'INR',
      date: targetDate,
      rate,
      source: 'UPSTREAM_API'
    };
  }

  private static async fetchRateFromUpstream(fromCur: string, dateStr: string): Promise<number> {
    const curLower = fromCur.toLowerCase();
    const primaryUrl = `${this.PRIMARY_BASE}@${dateStr}/v1/currencies/${curLower}.min.json`;
    const fallbackUrl = `${this.FALLBACK_BASE}/${curLower}.json`;

    // Attempt primary CDN (historical date)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(primaryUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data: any = await res.json();
        const rate = data[curLower]?.inr;
        if (typeof rate === 'number' && rate > 0) return rate;
      }
    } catch (err) {
      console.warn(`Primary FX CDN failed for ${fromCur} on ${dateStr}, trying fallback...`, err);
    }

    // Attempt fallback CDN (latest mirror)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(fallbackUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data: any = await res.json();
        const rate = data[curLower]?.inr;
        if (typeof rate === 'number' && rate > 0) return rate;
      }
    } catch (err) {
      console.error(`Fallback FX CDN failed for ${fromCur}:`, err);
    }

    // Hard fallback table if completely offline/air-gapped
    const emergencyRates: Record<string, number> = {
      USD: 84.15,
      EUR: 91.20,
      GBP: 109.50,
      AED: 22.91,
      SGD: 64.20,
      JPY: 0.55
    };

    if (emergencyRates[fromCur]) {
      return emergencyRates[fromCur];
    }

    throw new Error(`Unable to resolve exchange rate for ${fromCur} to INR`);
  }
}
