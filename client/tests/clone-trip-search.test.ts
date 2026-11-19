// client/tests/clone-trip-search.test.ts
import assert from 'node:assert/strict';
import { filterClonableTrips } from '../src/features/travel/utils/cloneTripSearch';
import type { TravelRequest } from '../src/features/travel/types/travel.types';

console.log('🧪 Starting Clone Trip Search Filter Test Suite (TDD RED Phase)...\n');

const mockTrips: TravelRequest[] = [
  {
    id: 'req-1',
    userId: 'u1',
    travelType: 'UPCOMING',
    title: 'Tokyo Architecture Integration',
    purpose: 'System alignment with Tokyo partners',
    projectCode: 'ENG-APAC-2026',
    origin: 'Bengaluru',
    destination: 'Tokyo, Japan',
    departureDate: '2026-12-01',
    returnDate: '2026-12-08',
    status: 'APPROVED',
    totalExpenses: 120000,
    currency: 'INR',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-02',
    emergencyContactName: 'HR',
    emergencyContactPhone: '+91 9999999999',
    expenses: [],
  },
  {
    id: 'req-2',
    userId: 'u1',
    travelType: 'ALREADY_TRAVELLED',
    title: 'London Fintech Conference',
    purpose: 'Speak on payments infrastructure',
    projectCode: 'FIN-2026',
    origin: 'Bengaluru',
    destination: 'London, UK',
    departureDate: '2026-10-10',
    returnDate: '2026-10-15',
    status: 'SETTLED',
    totalExpenses: 95000,
    currency: 'INR',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-16',
    emergencyContactName: 'HR',
    emergencyContactPhone: '+91 9999999999',
    expenses: [],
  },
  {
    id: 'req-3',
    userId: 'u1',
    travelType: 'UPCOMING',
    title: 'San Francisco Tech Sync',
    purpose: 'Q4 engineering planning',
    projectCode: 'ENG-US-2026',
    origin: 'Mumbai',
    destination: 'San Francisco, USA',
    departureDate: '2026-12-15',
    returnDate: '2026-12-20',
    status: 'PENDING_MANAGER_REVIEW',
    totalExpenses: 180000,
    currency: 'INR',
    createdAt: '2026-11-10',
    updatedAt: '2026-11-10',
    emergencyContactName: 'HR',
    emergencyContactPhone: '+91 9999999999',
    expenses: [],
  },
  {
    id: 'req-4',
    userId: 'u1',
    travelType: 'UPCOMING',
    title: 'Unfinished Draft Trip',
    purpose: 'Draft notes',
    projectCode: 'DRAFT-01',
    origin: 'Delhi',
    destination: 'Berlin, Germany',
    departureDate: '2026-12-25',
    returnDate: '2026-12-30',
    status: 'DRAFT',
    totalExpenses: 50000,
    currency: 'INR',
    createdAt: '2026-11-12',
    updatedAt: '2026-11-12',
    emergencyContactName: 'HR',
    emergencyContactPhone: '+91 9999999999',
    expenses: [],
  },
];

// Test 1: Empty or whitespace query returns all non-draft trips
console.log('Test 1: Empty or whitespace query returns all non-draft trips');
const res1 = filterClonableTrips(mockTrips, '');
assert.equal(res1.length, 3, 'Empty query should return all 3 non-draft trips');
assert.ok(!res1.some((t) => t.status === 'DRAFT'), 'Should exclude DRAFT trips');
console.log('  ✅ PASS: Empty query returns all non-draft trips');

// Test 2: Search by title (case-insensitive)
console.log('\nTest 2: Search by title (case-insensitive)');
const res2 = filterClonableTrips(mockTrips, 'tokyo');
assert.equal(res2.length, 1, 'Search for "tokyo" should return 1 trip');
assert.equal(res2[0].id, 'req-1');
console.log('  ✅ PASS: Title matching works');

// Test 3: Search by destination
console.log('\nTest 3: Search by destination');
const res3 = filterClonableTrips(mockTrips, 'London');
assert.equal(res3.length, 1);
assert.equal(res3[0].id, 'req-2');
console.log('  ✅ PASS: Destination matching works');

// Test 4: Search by project code
console.log('\nTest 4: Search by project code');
const res4 = filterClonableTrips(mockTrips, 'FIN-2026');
assert.equal(res4.length, 1);
assert.equal(res4[0].id, 'req-2');
console.log('  ✅ PASS: Project code matching works');

// Test 5: Search with no matches returns empty array
console.log('\nTest 5: Search with no matches returns empty array');
const res5 = filterClonableTrips(mockTrips, 'NonExistentCityXYZ');
assert.equal(res5.length, 0);
console.log('  ✅ PASS: Non-matching query returns empty array');

console.log('\n🎉 ALL CLONE TRIP SEARCH TESTS EVALUATED!\n');
