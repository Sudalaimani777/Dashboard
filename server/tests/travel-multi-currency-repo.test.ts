// server/tests/travel-multi-currency-repo.test.ts
import { travelRepository } from '../src/features/travel/travel.repository.js';
import { pool } from '../src/shared/db/pool.js';

async function testRepositoryMultiCurrency() {
  try {
    // 1. Fetch any test user
    const userRes = await pool.query('SELECT id, manager_id FROM users LIMIT 1');
    if (!userRes.rowCount) throw new Error('No users found in database for test');
    const user = userRes.rows[0];

    // 2. Create request with 1 INR expense and 1 USD expense
    const request = await travelRepository.createRequestWithExpenses({
      userId: user.id,
      managerId: user.manager_id,
      travelType: 'UPCOMING',
      title: 'London & NY Client Meetings',
      purpose: 'Annual executive review',
      projectCode: 'INTL-2026',
      origin: 'Mumbai',
      destination: 'New York',
      departureDate: '2026-12-01',
      returnDate: '2026-12-10',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+919876543210',
      expenses: [
        {
          category: 'FLIGHT',
          merchant: 'Air India',
          amount: 50000.00,
          originalAmount: 50000.00,
          originalCurrency: 'INR',
          exchangeRate: 1.0,
          inrAmount: 50000.00,
          expenseDate: '2026-12-01'
        },
        {
          category: 'HOTEL',
          merchant: 'Hilton Midtown',
          amount: 1000.00,
          originalAmount: 1000.00,
          originalCurrency: 'USD',
          exchangeRate: 84.15,
          inrAmount: 84150.00,
          expenseDate: '2026-12-02'
        }
      ] as any
    });

    // Verify total_expenses equals exactly ₹1,34,150.00 (50000 + 1000 * 84.15)
    if (Math.abs(Number(request.total_expenses) - 134150.00) > 0.01) {
      throw new Error(`Expected total_expenses 134150.00, got ${request.total_expenses}`);
    }

    // Verify expenses returned have currency details
    const fetched = await travelRepository.findById(request.id);
    const usdExpense = fetched?.expenses.find((e: any) => e.original_currency === 'USD' || e.originalCurrency === 'USD');
    if (!usdExpense || Number(usdExpense.original_amount || usdExpense.originalAmount) !== 1000.00) {
      throw new Error(`USD expense original amount mismatch: ${JSON.stringify(usdExpense)}`);
    }

    console.log('PASS: TravelRepository multi-currency test passed');
  } finally {
    await pool.end();
  }
}

testRepositoryMultiCurrency().catch((err) => {
  console.error('FAIL:', err);
  process.exit(1);
});
