// client/tests/travel-dates.test.ts
import assert from 'node:assert/strict';
import { computeTripDuration, getFiscalQuarterFromDate } from '../src/features/travel/utils/travelAnalytics';

console.log('🧪 Running Travel Dates & Duration Test Suite...');

// 1. Duration calculation between 14-11-2026 and 20-11-2026
const duration = computeTripDuration('2026-11-14', '2026-11-20');
assert.equal(duration.days, 7, 'Trip from 14th to 20th should be 7 days');
assert.equal(duration.nights, 6, 'Trip from 14th to 20th should be 6 nights');
assert.equal(duration.label, '6 nights · 7 days');

// Same day
const sameDay = computeTripDuration('2026-11-14', '2026-11-14');
assert.equal(sameDay.days, 1);
assert.equal(sameDay.nights, 0);
assert.equal(sameDay.label, 'Same-day trip');

// 2. Fiscal quarter without timezone shifting
assert.deepEqual(getFiscalQuarterFromDate('2026-11-14'), { year: 2026, quarter: 'Q4' });
assert.deepEqual(getFiscalQuarterFromDate('2026-01-01'), { year: 2026, quarter: 'Q1' });
assert.deepEqual(getFiscalQuarterFromDate('2026-04-01'), { year: 2026, quarter: 'Q2' });
assert.deepEqual(getFiscalQuarterFromDate('2026-07-01'), { year: 2026, quarter: 'Q3' });

console.log('✅ All travel date duration and fiscal quarter tests passed!');
