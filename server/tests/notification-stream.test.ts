// server/tests/notification-stream.test.ts
import { NotificationStreamRegistry } from '../src/features/notifications/notificationStream.js';
import type { Response } from 'express';

function createMockResponse(): { res: Response; written: string[]; ended: boolean } {
  const written: string[] = [];
  let ended = false;

  const res = {
    write: (chunk: any) => {
      written.push(String(chunk));
      return true;
    },
    end: () => {
      ended = true;
      return res;
    }
  } as unknown as Response;

  return { res, written, ended };
}

async function runStreamTests() {
  console.log('🧪 Starting NotificationStreamRegistry Test Suite...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (!condition) {
      throw new Error(`❌ Assertion failed: ${message}`);
    }
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  }

  const registry = new NotificationStreamRegistry(false); // disable auto heartbeat for test

  const client1 = createMockResponse();
  const client2 = createMockResponse();
  const clientUser2 = createMockResponse();

  const user1 = 'user-uuid-1';
  const user2 = 'user-uuid-2';

  // 1. Test addClient
  registry.addClient(user1, client1.res);
  registry.addClient(user1, client2.res); // 2nd tab
  registry.addClient(user2, clientUser2.res);

  assert(registry.getClientCount(user1) === 2, 'user1 has 2 registered clients');
  assert(registry.getClientCount(user2) === 1, 'user2 has 1 registered client');
  assert(registry.getClientCount() === 3, 'total client count is 3');

  // 2. Test broadcastToUser
  const payload = {
    type: 'TRAVEL_APPROVED',
    title: 'Trip Approved',
    message: 'Your trip to London has been approved'
  };

  registry.broadcastToUser(user1, payload);

  const expectedData = `data: ${JSON.stringify(payload)}\n\n`;
  assert(client1.written.includes(expectedData), 'client1 of user1 received formatted SSE data');
  assert(client2.written.includes(expectedData), 'client2 of user1 received formatted SSE data');
  assert(clientUser2.written.length === 0, 'client of user2 did NOT receive user1 broadcast');

  // 3. Test pingAll (heartbeat)
  registry.pingAll();
  assert(client1.written.includes(': ping\n\n'), 'client1 received heartbeat ping');
  assert(client2.written.includes(': ping\n\n'), 'client2 received heartbeat ping');
  assert(clientUser2.written.includes(': ping\n\n'), 'clientUser2 received heartbeat ping');

  // 4. Test removeClient
  registry.removeClient(user1, client1.res);
  assert(registry.getClientCount(user1) === 1, 'user1 has 1 client left after removing client1');

  registry.removeClient(user1, client2.res);
  assert(registry.getClientCount(user1) === 0, 'user1 has 0 clients left after removing client2');
  assert(registry.hasClient(user1) === false, 'user1 entry completely cleaned up from map');

  // Broadcast to user with no clients should be a no-op
  registry.broadcastToUser(user1, { test: 'noop' });
  assert(client1.written.length === 2, 'client1 received no further broadcasts after removal');

  // 5. Resilience to faulty client
  const faultyRes = {
    write: () => {
      throw new Error('Socket write failure');
    }
  } as unknown as Response;

  const validClient = createMockResponse();
  registry.addClient('user-resilience', faultyRes);
  registry.addClient('user-resilience', validClient.res);

  // Broadcast should not throw and valid client should still receive it
  registry.broadcastToUser('user-resilience', { msg: 'survives error' });
  const resiliencePayload = `data: ${JSON.stringify({ msg: 'survives error' })}\n\n`;
  assert(validClient.written.includes(resiliencePayload), 'valid client receives broadcast despite faulty peer');

  // Cleanup
  registry.stopHeartbeat();

  console.log(`\n🎉 All ${passed}/${total} NotificationStreamRegistry tests passed!`);
}

runStreamTests().catch((err) => {
  console.error('\n❌ NotificationStreamRegistry Test Suite Failed:', err.message);
  process.exit(1);
});
