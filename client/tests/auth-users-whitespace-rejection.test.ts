import assert from 'node:assert';
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../src/features/auth/schemas/auth.schema.js';
import {
  createUserSchema,
  updateUserSchema,
} from '../src/features/users/schemas/users.schema.js';
import {
  validateCreateUserInput,
  validateUpdateUserInput,
} from '../../server/src/features/users/users.validation.js';

console.log('🧪 Running Comprehensive Auth & User Whitespace Rejection Tests...\n');

// 1. signInSchema
console.log('1. Testing signInSchema...');
const signinSpacesPass = signInSchema.safeParse({ email: 'test@example.com', password: '   ' });
assert.strictEqual(signinSpacesPass.success, false, 'signInSchema must reject whitespace password');

const signinSingleSpacePass = signInSchema.safeParse({ email: 'test@example.com', password: ' ' });
assert.strictEqual(signinSingleSpacePass.success, false, 'signInSchema must reject single space password');

const signinSpacesEmail = signInSchema.safeParse({ email: '   ', password: 'password123' });
assert.strictEqual(signinSpacesEmail.success, false, 'signInSchema must reject whitespace email');

const signinValid = signInSchema.safeParse({ email: 'test@example.com', password: 'password123' });
assert.strictEqual(signinValid.success, true, 'signInSchema must accept valid credentials');
console.log('   ✓ signInSchema passes all whitespace checks');

// 2. signUpSchema
console.log('2. Testing signUpSchema...');
const signupSpacesPass = signUpSchema.safeParse({
  name: 'John Doe',
  email: 'john@example.com',
  password: '      ',
  confirmPassword: '      ',
});
assert.strictEqual(signupSpacesPass.success, false, 'signUpSchema must reject 6-space password');

const signupSpacesName = signUpSchema.safeParse({
  name: '     ',
  email: 'john@example.com',
  password: 'Password@123',
  confirmPassword: 'Password@123',
});
assert.strictEqual(signupSpacesName.success, false, 'signUpSchema must reject whitespace name');

const signupValid = signUpSchema.safeParse({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password@123',
  confirmPassword: 'Password@123',
});
assert.strictEqual(signupValid.success, true, 'signUpSchema must accept valid inputs');
console.log('   ✓ signUpSchema passes all whitespace checks');

// 3. forgotPasswordSchema
console.log('3. Testing forgotPasswordSchema...');
const forgotSpaces = forgotPasswordSchema.safeParse({ email: '   ' });
assert.strictEqual(forgotSpaces.success, false, 'forgotPasswordSchema must reject whitespace email');

const forgotValid = forgotPasswordSchema.safeParse({ email: 'test@example.com' });
assert.strictEqual(forgotValid.success, true, 'forgotPasswordSchema must accept valid email');
console.log('   ✓ forgotPasswordSchema passes all whitespace checks');

// 4. resetPasswordSchema
console.log('4. Testing resetPasswordSchema...');
const resetSpacesPass = resetPasswordSchema.safeParse({
  password: '        ',
  confirmPassword: '        ',
});
assert.strictEqual(resetSpacesPass.success, false, 'resetPasswordSchema must reject 8-space password');

const resetValid = resetPasswordSchema.safeParse({
  password: 'NewStrongPassword@2026',
  confirmPassword: 'NewStrongPassword@2026',
});
assert.strictEqual(resetValid.success, true, 'resetPasswordSchema must accept valid strong password');
console.log('   ✓ resetPasswordSchema passes all whitespace checks');

// 5. createUserSchema & updateUserSchema (Client)
console.log('5. Testing createUserSchema & updateUserSchema...');
const createSpacesPass = createUserSchema.safeParse({
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: '        ',
  role: 'EMPLOYEE',
  department: 'Engineering',
});
assert.strictEqual(createSpacesPass.success, false, 'createUserSchema must reject 8-space password');

const createPunctOnlyName = createUserSchema.safeParse({
  name: '- -',
  email: 'jane@example.com',
  password: 'ValidPassword@123',
  role: 'EMPLOYEE',
  department: 'Engineering',
});
assert.strictEqual(createPunctOnlyName.success, false, 'createUserSchema must reject name with no letters');

const createSpacesDept = createUserSchema.safeParse({
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'ValidPassword@123',
  role: 'EMPLOYEE',
  department: '   ',
});
assert.strictEqual(createSpacesDept.success, false, 'createUserSchema must reject whitespace department');

const createValid = createUserSchema.safeParse({
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'ValidPassword@123',
  role: 'EMPLOYEE',
  department: 'Engineering',
});
assert.strictEqual(createValid.success, true, 'createUserSchema must accept valid member details');

const updateSpacesDept = updateUserSchema.safeParse({
  role: 'EMPLOYEE',
  department: '   ',
});
assert.strictEqual(updateSpacesDept.success, false, 'updateUserSchema must reject whitespace department');
console.log('   ✓ createUserSchema & updateUserSchema pass all whitespace checks');

// 6. Backend users.validation.ts
console.log('6. Testing server users.validation.ts...');
assert.throws(
  () => {
    validateCreateUserInput({
      name: 'Jane Doe',
      email: 'jane@company.com',
      password: '        ',
      role: 'EMPLOYEE',
      department: 'Engineering',
    });
  },
  /cannot be only whitespace/,
  'Server validation must reject 8-space initial password'
);

assert.throws(
  () => {
    validateCreateUserInput({
      name: '- -',
      email: 'jane@company.com',
      password: 'StrongPassword@123',
      role: 'EMPLOYEE',
      department: 'Engineering',
    });
  },
  /Name must be 2–100 characters/,
  'Server validation must reject non-letter names'
);

assert.throws(
  () => {
    validateCreateUserInput({
      name: 'Jane Doe',
      email: 'jane@company.com',
      password: 'StrongPassword@123',
      role: 'EMPLOYEE',
      department: '   ',
    });
  },
  /Department must be between 2 and 80 characters/,
  'Server validation must reject whitespace department'
);

assert.throws(
  () => {
    validateUpdateUserInput({
      department: '   ',
    });
  },
  /Department must be between 2 and 80 characters/,
  'Server update validation must reject whitespace department'
);

const validServerUser = validateCreateUserInput({
  name: 'Jane Doe',
  email: 'jane@company.com',
  password: 'StrongPassword@123',
  role: 'EMPLOYEE',
  department: 'Engineering',
});
assert.strictEqual(validServerUser.name, 'Jane Doe');
assert.strictEqual(validServerUser.password, 'StrongPassword@123');
console.log('   ✓ Server users.validation.ts passes all whitespace checks');

console.log('\n🎉 ALL AUTH & USER WHITESPACE REJECTION TESTS PASSED SUCCESSFULLY!\n');
