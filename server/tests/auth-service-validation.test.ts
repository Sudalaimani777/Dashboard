import { AuthService } from '../src/features/auth/auth.service.js';
import { IAuthRepository } from '../src/features/auth/auth.repository.js';
import { IEmailService } from '../src/shared/services/email.service.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAuthServiceValidationTests() {
  console.log('🧪 Running Server AuthService Validation Tests...\n');

  // Create lightweight mock repo & mailer so we only test validation logic
  const mockRepo: IAuthRepository = {
    findByEmail: async () => null,
    findById: async () => null,
    create: async () => {
      throw new Error('create should not be called on validation failure');
    },
    setResetToken: async () => {},
    findByResetToken: async () => null,
    updatePasswordAndClearReset: async () => {},
  };

  const mockMailer: IEmailService = {
    sendPasswordResetEmail: async () => ({ messageId: '1' }),
  };

  const service = new AuthService(mockRepo, mockMailer);

  const validBase = {
    email: 'valid@example.com',
    password: 'Password123!',
  };

  // Test 1: Reject special characters '@@@@@@@@@@'
  let specialCharsError: Error | null = null;
  try {
    await service.signup({
      ...validBase,
      name: '@@@@@@@@@@',
    });
  } catch (err) {
    specialCharsError = err as Error;
  }
  assert(
    specialCharsError !== null,
    'Expected signup to REJECT special characters like @@@@@@@@@@'
  );
  assert(
    specialCharsError?.message === 'Name can only contain letters, spaces, hyphens, and apostrophes',
    `Expected 'Name can only contain letters, spaces, hyphens, and apostrophes', got '${specialCharsError?.message}'`
  );

  // Test 2: Reject HTML/Script injection
  let xssError: Error | null = null;
  try {
    await service.signup({
      ...validBase,
      name: '<script>alert(1)</script>',
    });
  } catch (err) {
    xssError = err as Error;
  }
  assert(
    xssError?.message === 'Name can only contain letters, spaces, hyphens, and apostrophes',
    `Expected XSS reject message, got '${xssError?.message}'`
  );

  // Test 3: Reject name > 100 characters
  let longNameError: Error | null = null;
  try {
    await service.signup({
      ...validBase,
      name: 'A'.repeat(101),
    });
  } catch (err) {
    longNameError = err as Error;
  }
  assert(
    longNameError?.message === 'Name cannot exceed 100 characters',
    `Expected length error, got '${longNameError?.message}'`
  );

  // Test 4: Reject single letter
  let singleCharError: Error | null = null;
  try {
    await service.signup({
      ...validBase,
      name: 'A',
    });
  } catch (err) {
    singleCharError = err as Error;
  }
  assert(
    singleCharError?.message === 'Name must be at least 2 characters long',
    `Expected min length error, got '${singleCharError?.message}'`
  );

  console.log('✅ ALL SERVER AUTH VALIDATION TESTS PASSED!\n');
}

runAuthServiceValidationTests().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
