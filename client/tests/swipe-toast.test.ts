import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getToastFuseColor } from '../src/shared/context/ToastContext';

async function run() {
  console.log('🧪 Testing SwipeToast and ToastContext...');

  // 1. Validate SwipeToast.tsx source code
  const toastSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/shared/components/toast/SwipeToast.tsx'),
    'utf8'
  );
  assert.ok(toastSource.includes('motion/react') || toastSource.includes('motion'), 'SwipeToast must import from motion or motion/react');
  assert.ok(toastSource.includes('Cancel01Icon'), 'SwipeToast must use Cancel01Icon');
  assert.ok(toastSource.includes('HugeiconsIcon'), 'SwipeToast must use HugeiconsIcon');
  assert.ok(toastSource.includes('pauseOnHover'), 'SwipeToast must support pauseOnHover');
  assert.ok(toastSource.includes('swipeDistance'), 'SwipeToast must support swipeDistance');
  assert.ok(toastSource.includes('closeButton'), 'SwipeToast must support closeButton');
  assert.ok(toastSource.includes('fuse'), 'SwipeToast must support fuse timer');
  assert.ok(toastSource.includes('onClick'), 'SwipeToast must handle onClick');

  // 2. Validate SwipeToast.css
  const cssSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/shared/components/toast/SwipeToast.css'),
    'utf8'
  );
  assert.ok(cssSource.includes('.swipe-toast'), 'SwipeToast.css must define .swipe-toast');
  assert.ok(cssSource.includes('.swipe-toast__fuse'), 'SwipeToast.css must define .swipe-toast__fuse');
  assert.ok(cssSource.includes('.swipe-toast__card'), 'SwipeToast.css must define .swipe-toast__card');

  // 3. Test dynamic fuse color resolver
  assert.equal(getToastFuseColor('REVISION_REQUESTED'), '#F59E0B', 'Revision requested must use amber fuse color');
  assert.equal(getToastFuseColor('TRAVEL_APPROVED'), '#10B981', 'Travel approved must use emerald fuse color');
  assert.equal(getToastFuseColor('TRAVEL_SETTLED'), '#10B981', 'Travel settled must use emerald fuse color');
  assert.equal(getToastFuseColor('USER_CREATED'), '#10B981', 'User created must use emerald fuse color');
  assert.equal(getToastFuseColor('TRAVEL_REJECTED'), '#EF4444', 'Travel rejected must use destructive red fuse color');
  assert.equal(getToastFuseColor('TRAVEL_SUBMITTED'), '#533AFD', 'Travel submitted must use brand primary indigo');
  assert.equal(getToastFuseColor('FORWARDED_TO_ADMIN'), '#533AFD', 'Forwarded to admin must use brand primary indigo');
  assert.equal(getToastFuseColor('MANAGER_OVERSIGHT'), '#533AFD', 'Manager oversight must use brand primary indigo');
  assert.equal(getToastFuseColor(undefined), '#533AFD', 'Undefined type must default to brand primary indigo');

  // 4. Validate ToastContext.tsx source code & theme
  const contextSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/shared/context/ToastContext.tsx'),
    'utf8'
  );
  assert.ok(contextSource.includes('duration: toast.duration ?? 8000') || contextSource.includes('duration ?? 8000'), 'Toast must default duration to 8000ms');
  assert.ok(contextSource.includes('/dashboard?tab=notifications'), 'Default linkUrl must be /dashboard?tab=notifications');
  assert.ok(contextSource.includes('background="#FFFFFF"'), 'ToastContext must use crisp white light-mode surface');
  assert.ok(contextSource.includes('color="#0F172A"'), 'ToastContext must use slate-900 typography');
  assert.ok(contextSource.includes('ToastProvider'), 'ToastContext must export ToastProvider');
  assert.ok(contextSource.includes('useToast'), 'ToastContext must export useToast');

  // 5. Validate NewUserPage toast integration
  const newUserSource = fs.readFileSync(
    path.resolve(import.meta.dirname, '../src/features/users/pages/NewUserPage.tsx'),
    'utf8'
  );
  assert.ok(newUserSource.includes('useToast'), 'NewUserPage must use useToast hook');
  assert.ok(newUserSource.includes('showToast('), 'NewUserPage must call showToast upon user creation');
  assert.ok(newUserSource.includes("type: 'USER_CREATED'"), 'NewUserPage must dispatch USER_CREATED toast');

  console.log('✅ ALL SWIPE TOAST & TOAST CONTEXT TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
