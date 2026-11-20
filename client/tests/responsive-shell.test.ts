import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Responsive Navigation Shell (TDD RED)...');

  const dashboardLayoutPath = path.resolve('client/src/features/travel/layout/DashboardLayout.tsx');
  const sidebarPath = path.resolve('client/src/features/travel/layout/DynamicRoleSidebar.tsx');
  const userProfilePath = path.resolve('client/src/features/travel/layout/SidebarUserProfile.tsx');

  const layoutCode = fs.readFileSync(dashboardLayoutPath, 'utf8');
  const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');
  const userProfileCode = fs.readFileSync(userProfilePath, 'utf8');

  // 1. DashboardLayout must have a sticky mobile header for <lg
  assert.ok(
    layoutCode.includes('lg:hidden') && layoutCode.includes('aria-label="Open navigation menu"'),
    'DashboardLayout must render a mobile header with a hamburger button labeled "Open navigation menu"'
  );

  // 2. DashboardLayout must manage mobile drawer open/close state
  assert.ok(
    layoutCode.includes('isMobileDrawerOpen') && layoutCode.includes('setIsMobileDrawerOpen'),
    'DashboardLayout must manage isMobileDrawerOpen state'
  );

  // 3. DynamicRoleSidebar must accept isMobileDrawerOpen and onCloseMobileDrawer props
  assert.ok(
    sidebarCode.includes('isMobileDrawerOpen') && sidebarCode.includes('onCloseMobileDrawer'),
    'DynamicRoleSidebar must support mobile drawer open/close props'
  );

  // 4. DynamicRoleSidebar must render mobile backdrop and drawer panel on <lg
  assert.ok(
    sidebarCode.includes('aria-label="Close navigation menu"') && sidebarCode.includes('backdrop-blur'),
    'DynamicRoleSidebar must include an overlay backdrop and an accessible close button'
  );

  // 5. SidebarUserProfile must support showing Sign Out button in mobile drawer
  assert.ok(
    userProfileCode.includes('isDrawerMode') || userProfileCode.includes('showSignOutAlways') || sidebarCode.includes('isDrawer'),
    'SidebarUserProfile or DynamicRoleSidebar must ensure Sign Out is accessible in mobile drawer mode'
  );

  // 6. DashboardLayout main area padding must be fluid (0 left padding on mobile, dynamic on desktop)
  assert.ok(
    layoutCode.includes('pt-14') || layoutCode.includes('pt-16'),
    'DashboardLayout main area must offset the sticky mobile header with top padding on mobile'
  );

  // 7. DashboardLayout mobile header must NOT contain a static non-functional avatar circle
  assert.ok(
    !layoutCode.includes('userInitials') && !layoutCode.includes('{userInitials}'),
    'DashboardLayout mobile header must omit static non-functional profile avatar'
  );

  console.log('✅ Responsive shell structural tests passed!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
