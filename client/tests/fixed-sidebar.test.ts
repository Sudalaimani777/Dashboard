import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  console.log('🧪 Testing Fixed Desktop Sidebar Refactor (TDD)...');

  const layoutPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/layout/DashboardLayout.tsx'
  );
  const layoutSource = fs.readFileSync(layoutPath, 'utf8');

  const sidebarPath = path.resolve(
    import.meta.dirname,
    '../src/features/travel/layout/DynamicRoleSidebar.tsx'
  );
  const sidebarSource = fs.readFileSync(sidebarPath, 'utf8');

  // 1. DashboardLayout must not have isPinned state or dynamic conditional padding
  assert.ok(
    !layoutSource.includes('isPinned'),
    'DashboardLayout must not contain isPinned state or props'
  );
  assert.ok(
    !layoutSource.includes('onTogglePin'),
    'DashboardLayout must not pass onTogglePin prop'
  );
  assert.ok(
    !layoutSource.includes("isPinned ? 'lg:pl-[256px]' : 'lg:pl-[76px]'"),
    'DashboardLayout main area must not use dynamic conditional left padding based on isPinned'
  );
  assert.ok(
    layoutSource.includes('lg:pl-64') || layoutSource.includes('lg:pl-[256px]'),
    'DashboardLayout main area must have fixed 256px left padding for desktop (lg:pl-64 or lg:pl-[256px])'
  );

  // 2. DynamicRoleSidebar must not have Pin / PinOff icons
  assert.ok(
    !sidebarSource.includes('Pin,') && !sidebarSource.includes('PinOff'),
    'DynamicRoleSidebar must not import or render Pin / PinOff toggle icons'
  );

  // 3. DynamicRoleSidebar must not have hover listeners or hover state
  assert.ok(
    !sidebarSource.includes('isHovered') && !sidebarSource.includes('setIsHovered'),
    'DynamicRoleSidebar must not maintain isHovered state'
  );
  assert.ok(
    !sidebarSource.includes('onMouseEnter') && !sidebarSource.includes('onMouseLeave'),
    'DynamicRoleSidebar desktop aside must not have hover mouse listeners'
  );

  // 4. DynamicRoleSidebar must have fixed desktop width (w-64 or w-[256px])
  assert.ok(
    !sidebarSource.includes("isExpanded ? 'w-[256px]' : 'w-[76px]'"),
    'DynamicRoleSidebar desktop aside must not dynamically toggle width between expanded and collapsed'
  );
  assert.ok(
    sidebarSource.includes('w-64') || sidebarSource.includes('w-[256px]'),
    'DynamicRoleSidebar desktop aside must have fixed 256px width'
  );

  // 5. Brand Header must not be a toggle button
  assert.ok(
    !sidebarSource.includes('aria-label={pinned ? \'Collapse sidebar\' : \'Expand and pin sidebar\'}'),
    'Brand Header must not be a collapse/pin toggle button'
  );

  // 6. Mobile drawer support must still be present
  assert.ok(
    sidebarSource.includes('isMobileDrawerOpen') && sidebarSource.includes('onCloseMobileDrawer'),
    'DynamicRoleSidebar must preserve mobile drawer support for screens < lg'
  );
  assert.ok(
    layoutSource.includes('isMobileDrawerOpen') && layoutSource.includes('setIsMobileDrawerOpen'),
    'DashboardLayout must preserve mobile drawer state and header hamburger button'
  );

  console.log('✅ ALL FIXED DESKTOP SIDEBAR TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
