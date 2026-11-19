// client/tests/travel-detail-dual-currency.test.ts
import fs from 'node:fs';

function testDetailSource() {
  const content = fs.readFileSync('src/features/travel/pages/TravelDetailPage.tsx', 'utf-8');
  if (!content.includes('original_currency') && !content.includes('originalCurrency')) {
    throw new Error('TravelDetailPage does not support rendering original_currency');
  }

  const gaugeContent = fs.readFileSync('src/features/travel/components/audit/BudgetImpactGauge.tsx', 'utf-8');
  if (!gaugeContent.includes('formatINR')) {
    throw new Error('BudgetImpactGauge does not format currency in INR');
  }

  console.log('PASS: TravelDetailPage source verified for dual-currency');
}

testDetailSource();
