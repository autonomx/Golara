import assert from 'node:assert/strict';
import {
  getInquiryRecommendedAction,
  getInquiryWorkflowStep,
  getInquiryWorkflowSummary,
  inquiryWorkflowSteps,
  isTerminalInquiryStatus
} from '../../lib/inquiries/inquiry-workflow';

export async function runInquiryWorkflowTests() {
  assert.equal(inquiryWorkflowSteps.length, 5);
  assert.deepEqual(inquiryWorkflowSteps.map((step) => step.status), ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled']);

  assert.equal(getInquiryWorkflowStep('new').label, 'New');
  assert.equal(getInquiryWorkflowStep('contacted').terminal, false);
  assert.equal(getInquiryWorkflowStep('confirmed').recommendedAction.includes('Coordinate preparation'), true);
  assert.equal(getInquiryWorkflowStep('unknown').status, 'new');

  assert.equal(isTerminalInquiryStatus('new'), false);
  assert.equal(isTerminalInquiryStatus('contacted'), false);
  assert.equal(isTerminalInquiryStatus('confirmed'), false);
  assert.equal(isTerminalInquiryStatus('fulfilled'), true);
  assert.equal(isTerminalInquiryStatus('cancelled'), true);
  assert.equal(isTerminalInquiryStatus('unknown'), false);

  assert.equal(getInquiryRecommendedAction('cancelled'), 'Keep the reason in staff notes or the follow-up timeline for audit context.');

  assert.deepEqual(
    getInquiryWorkflowSummary([
      { status: 'new', count: 3 },
      { status: 'contacted', count: 2 },
      { status: 'confirmed', count: 1 },
      { status: 'fulfilled', count: 4 },
      { status: 'cancelled', count: 5 }
    ]),
    {
      active: 6,
      closed: 9,
      needsFirstReview: 3,
      waitingOnCustomer: 2,
      readyToFulfill: 1
    }
  );

  console.log('inquiry-workflow.test.ts passed');
}
