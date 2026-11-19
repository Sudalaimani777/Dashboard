// server/tests/email-notifications.test.ts
import { EmailService } from '../src/shared/services/email.service.js';

async function runEmailTests() {
  console.log('🧪 Starting EmailService Transactional Templates Test Suite...\n');

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

  const sentMails: any[] = [];
  const mockTransporter: any = {
    sendMail: async (options: any) => {
      sentMails.push(options);
      return {
        messageId: `msg-${Date.now()}-${sentMails.length}`,
      };
    },
  };

  const emailService = new EmailService();
  emailService.setTransporter(mockTransporter);

  const sampleTrip = {
    id: 'trip-123',
    title: 'Client Onboarding in Mumbai',
    origin: 'Bangalore',
    destination: 'Mumbai',
    departureDate: '2026-12-01',
    returnDate: '2026-12-05',
    totalExpenses: 45000,
    currency: 'INR'
  };

  // 1. sendTravelSubmittedEmail
  const res1 = await emailService.sendTravelSubmittedEmail(
    'manager@example.com',
    'Sarah Connor',
    'Alex Rivera',
    sampleTrip
  );
  assert(!!res1.messageId, 'sendTravelSubmittedEmail returns messageId');
  assert(sentMails[0].to === 'manager@example.com', 'sendTravelSubmittedEmail sent to manager');
  assert(
    sentMails[0].subject === 'New Travel Request from Alex Rivera awaiting review',
    'sendTravelSubmittedEmail has correct subject'
  );
  assert(sentMails[0].html.includes('Sarah Connor'), 'HTML includes manager name');
  assert(sentMails[0].html.includes('Alex Rivera'), 'HTML includes requester name');
  assert(sentMails[0].html.includes('Client Onboarding in Mumbai'), 'HTML includes trip title');
  assert(sentMails[0].html.includes('#533AFD'), 'HTML contains TripFlow indigo token');

  // 2. sendRevisionRequestedEmail
  const res2 = await emailService.sendRevisionRequestedEmail(
    'employee@example.com',
    'Alex Rivera',
    'Sarah Connor',
    'Please attach the flight invoice & lower hotel budget',
    sampleTrip
  );
  assert(!!res2.messageId, 'sendRevisionRequestedEmail returns messageId');
  assert(sentMails[1].to === 'employee@example.com', 'sendRevisionRequestedEmail sent to employee');
  assert(
    sentMails[1].subject === 'Action Required: Revisions requested on Client Onboarding in Mumbai',
    'sendRevisionRequestedEmail has correct subject'
  );
  assert(sentMails[1].html.includes('Alex Rivera'), 'HTML includes employee name');
  assert(sentMails[1].html.includes('Sarah Connor'), 'HTML includes reviewer name');
  assert(sentMails[1].html.includes('Please attach the flight invoice &amp; lower hotel budget'), 'HTML includes escaped remarks');

  // 3. sendTravelApprovedEmail
  const res3 = await emailService.sendTravelApprovedEmail(
    'employee@example.com',
    'Alex Rivera',
    sampleTrip
  );
  assert(!!res3.messageId, 'sendTravelApprovedEmail returns messageId');
  assert(sentMails[2].to === 'employee@example.com', 'sendTravelApprovedEmail sent to employee');
  assert(
    sentMails[2].subject === 'Travel Request Approved: Client Onboarding in Mumbai',
    'sendTravelApprovedEmail has correct subject'
  );
  assert(sentMails[2].html.includes('Alex Rivera'), 'HTML includes employee name');
  assert(sentMails[2].html.includes('Approved'), 'HTML indicates approved state');

  // 4. sendTravelSettledEmail
  const res4 = await emailService.sendTravelSettledEmail(
    'employee@example.com',
    'Alex Rivera',
    sampleTrip
  );
  assert(!!res4.messageId, 'sendTravelSettledEmail returns messageId');
  assert(sentMails[3].to === 'employee@example.com', 'sendTravelSettledEmail sent to employee');
  assert(
    sentMails[3].subject === 'Reimbursement Settled: Client Onboarding in Mumbai',
    'sendTravelSettledEmail has correct subject'
  );
  assert(sentMails[3].html.includes('Settled'), 'HTML indicates settled state');

  // 5. sendTravelRejectedEmail
  const res5 = await emailService.sendTravelRejectedEmail(
    'employee@example.com',
    'Alex Rivera',
    'Policy violation: Hotel exceeds per-diem cap',
    sampleTrip
  );
  assert(!!res5.messageId, 'sendTravelRejectedEmail returns messageId');
  assert(sentMails[4].to === 'employee@example.com', 'sendTravelRejectedEmail sent to employee');
  assert(
    sentMails[4].subject === 'Travel Request Update: Client Onboarding in Mumbai',
    'sendTravelRejectedEmail has correct subject'
  );
  assert(sentMails[4].html.includes('Policy violation: Hotel exceeds per-diem cap'), 'HTML includes reject reason');

  // 6. sendManagerOversightEmail
  const res6 = await emailService.sendManagerOversightEmail(
    'admin@example.com',
    'John Admin',
    'Sarah Connor',
    sampleTrip
  );
  assert(!!res6.messageId, 'sendManagerOversightEmail returns messageId');
  assert(sentMails[5].to === 'admin@example.com', 'sendManagerOversightEmail sent to admin');
  assert(
    sentMails[5].subject === 'Executive Oversight Required: Manager personal travel by Sarah Connor',
    'sendManagerOversightEmail has correct subject'
  );
  assert(sentMails[5].html.includes('John Admin'), 'HTML includes admin name');
  assert(sentMails[5].html.includes('Sarah Connor'), 'HTML includes manager name');

  // 7. Test XSS / special characters escaping
  const xssTrip = {
    title: '<script>alert("hack")</script>',
    origin: 'Delhi <script>',
    destination: 'Goa & "Sun"',
    totalExpenses: 12000,
    currency: 'INR'
  };
  await emailService.sendTravelSubmittedEmail('m@test.com', 'Mgr <tag>', 'Req "quote"', xssTrip);
  const xssMail = sentMails[6];
  assert(!xssMail.html.includes('<script>'), 'HTML escapes script tags');
  assert(xssMail.html.includes('&lt;script&gt;alert'), 'HTML contains escaped script tags');
  assert(xssMail.html.includes('&amp; &quot;Sun&quot;'), 'HTML contains escaped ampersand and quotes');

  console.log(`\n🎉 All ${passed}/${total} EmailService template tests passed!`);
}

runEmailTests().catch((err) => {
  console.error('\n❌ Email Test Suite Failed:', err.message);
  process.exit(1);
});
