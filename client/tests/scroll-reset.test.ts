import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing route & tab scroll-to-top reset...');

  const dashboardLayoutPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/layout/DashboardLayout.tsx'
  );
  const dashboardLayout = fs.readFileSync(dashboardLayoutPath, 'utf8');

  assert.ok(
    dashboardLayout.includes('useRef') && dashboardLayout.includes('useEffect'),
    'DashboardLayout.tsx must use useRef and useEffect to reset <main> scroll position'
  );
  assert.ok(
    dashboardLayout.includes('location.pathname') && dashboardLayout.includes('location.search'),
    'DashboardLayout.tsx scroll reset effect must trigger on both location.pathname and location.search'
  );
  assert.ok(
    dashboardLayout.includes('scrollTop = 0') || dashboardLayout.includes('scrollTo('),
    'DashboardLayout.tsx must reset <main> scroll position to top'
  );

  const appRoutesPath = path.resolve(
    import.meta.dirname,
    '../src/routes/AppRoutes.tsx'
  );
  const appRoutes = fs.readFileSync(appRoutesPath, 'utf8');
  assert.ok(
    appRoutes.includes('ScrollToTop') || appRoutes.includes('window.scrollTo'),
    'AppRoutes.tsx must reset window scroll position on route changes'
  );

  console.log('✅ ALL SCROLL RESET TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
