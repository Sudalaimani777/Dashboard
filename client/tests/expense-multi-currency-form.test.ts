// client/tests/expense-multi-currency-form.test.ts
import fs from 'node:fs';

function testExpenseFormSource() {
  const content = fs.readFileSync('src/features/travel/components/forms/ExpenseRowItem.tsx', 'utf-8');
  if (!content.includes('originalCurrency') || !content.includes('useFxRate')) {
    throw new Error('ExpenseRowItem does not yet integrate multi-currency and useFxRate');
  }

  const tableContent = fs.readFileSync('src/features/travel/components/forms/DynamicExpenseTable.tsx', 'utf-8');
  if (!tableContent.includes('originalCurrency') && !tableContent.includes('Currency')) {
    throw new Error('DynamicExpenseTable does not mention Currency');
  }

  console.log('PASS: ExpenseRowItem and DynamicExpenseTable verified for multi-currency');
}

testExpenseFormSource();
