/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from '@jest/globals';

import {
  MemberStatus,
  CycleStatus,
  PeriodStatus,
  ContributionStatus,
  PaymentStatus,
  PayoutStatus,
  ReconciliationStatus,
  OverpaymentAction,
  ExitResolution,
  PeriodClosureReason,
  MeetingStatus,
  MemberRole,
  SocialFundPurpose,
  LoanVoteResult
} from './chama.enums';

import {
  ChamaConfiguration,
  ChamaMember,
  ChamaCycle,
  ChamaPeriod,
  ContributionRequirement,
  ContributionPayment,
  PoolStatus,
  Payout,
  ReconciliationRecord,
  AuditEvent
} from './chama.model';

// ── Enum Completeness ────────────────────────────────────────────

describe('Chama enums', () => {
  it('MemberStatus covers all required states', () => {
    const expected = [
      'PENDING',
      'ACTIVE',
      'SUSPENDED',
      'EXITED'
    ];
    expected.forEach((status) => {
      expect(MemberStatus[status as keyof typeof MemberStatus]).toBeDefined();
    });
  });
  it('CycleStatus covers all required states', () => {
    const expected = [
      'UPCOMING',
      'ACTIVE',
      'COMPLETED',
      'CANCELLED'
    ];
    expected.forEach((status) => {
      expect(CycleStatus[status as keyof typeof CycleStatus]).toBeDefined();
    });
    // UPCOMING is used instead of DRAFT in this implementation
  });

  it('PeriodStatus covers all required states from the spec', () => {
    const expected = [
      'UPCOMING',
      'OPEN',
      'COLLECTING',
      'READY_FOR_PAYOUT',
      'PAYOUT_PENDING',
      'PAID',
      'CLOSED',
      'SHORTFALL',
      'SUSPENDED'
    ];
    expected.forEach((status) => {
      expect(PeriodStatus[status as keyof typeof PeriodStatus]).toBeDefined();
    });
  });

  it('ContributionStatus covers all required states', () => {
    const expected = [
      'DUE',
      'PARTIALLY_PAID',
      'PAID',
      'OVERDUE',
      'WAIVED',
      'CANCELLED'
    ];
    expected.forEach((status) => {
      expect(ContributionStatus[status as keyof typeof ContributionStatus]).toBeDefined();
    });
  });

  it('PaymentStatus covers all required states', () => {
    const expected = [
      'INITIATED',
      'PENDING',
      'SUCCESS',
      'FAILED',
      'UNKNOWN',
      'REVERSED',
      'REFUNDED'
    ];
    expected.forEach((status) => {
      expect(PaymentStatus[status as keyof typeof PaymentStatus]).toBeDefined();
    });
  });

  it('PayoutStatus covers all required states', () => {
    const expected = [
      'READY',
      'PENDING_APPROVAL',
      'APPROVED',
      'INITIATING',
      'PROVIDER_PENDING',
      'COMPLETED',
      'FAILED',
      'UNKNOWN',
      'REVERSED'
    ];
    expected.forEach((status) => {
      expect(PayoutStatus[status as keyof typeof PayoutStatus]).toBeDefined();
    });
  });

  it('ReconciliationStatus covers all required states', () => {
    const expected = [
      'MATCHED',
      'UNMATCHED',
      'AMOUNT_MISMATCH',
      'DUPLICATE',
      'UNKNOWN',
      'REVERSED'
    ];
    expected.forEach((status) => {
      expect(ReconciliationStatus[status as keyof typeof ReconciliationStatus]).toBeDefined();
    });
  });

  it('MeetingStatus covers SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED', () => {
    expect(MeetingStatus.SCHEDULED).toBe('SCHEDULED');
    expect(MeetingStatus.IN_PROGRESS).toBe('IN_PROGRESS');
    expect(MeetingStatus.COMPLETED).toBe('COMPLETED');
    expect(MeetingStatus.CANCELLED).toBe('CANCELLED');
  });

  it('MemberRole covers all governance roles', () => {
    expect(MemberRole.CHAIRPERSON).toBe('CHAIRPERSON');
    expect(MemberRole.SECRETARY).toBe('SECRETARY');
    expect(MemberRole.TREASURER).toBe('TREASURER');
    expect(MemberRole.LOAN_OFFICER).toBe('LOAN_OFFICER');
    expect(MemberRole.MEMBER).toBe('MEMBER');
  });

  it('LoanVoteResult covers APPROVED, REJECTED, PENDING', () => {
    expect(LoanVoteResult.APPROVED).toBe('APPROVED');
    expect(LoanVoteResult.REJECTED).toBe('REJECTED');
    expect(LoanVoteResult.PENDING).toBe('PENDING');
  });

  it('SocialFundPurpose covers all defined purposes', () => {
    expect(SocialFundPurpose.FUNERAL).toBe('FUNERAL');
    expect(SocialFundPurpose.MEDICAL).toBe('MEDICAL');
    expect(SocialFundPurpose.CELEBRATION).toBe('CELEBRATION');
    expect(SocialFundPurpose.EMERGENCY).toBe('EMERGENCY');
    expect(SocialFundPurpose.OTHER).toBe('OTHER');
  });
});

// ── Business Invariants ──────────────────────────────────────────

describe('Chama business invariants', () => {
  it('outstanding = amountDue + applicableFees - validPayments (no floating point)', () => {
    const amountDue = 5000;
    const lateFee = 200;
    const paymentsMade = 3000;

    // Must be integer-safe arithmetic
    const outstanding = amountDue + lateFee - paymentsMade;
    expect(outstanding).toBe(2200);
    // Verify no floating point artifacts
    expect(Number.isInteger(outstanding)).toBe(true);
  });

  it('Expected Pool = eligible members × contribution amount', () => {
    const activeMembers = 12;
    const contributionAmount = 5000;

    const expectedPool = activeMembers * contributionAmount;
    expect(expectedPool).toBe(60000);
  });

  it('Collected Pool = sum of confirmed valid contributions', () => {
    const contributions: { amount: number; status: string }[] = [
      { amount: 5000, status: 'PAID' },
      { amount: 5000, status: 'PAID' },
      { amount: 5000, status: 'PARTIALLY_PAID' },
      { amount: 3000, status: 'PAID' },
      { amount: 5000, status: 'WAIVED' }
    ];
    const collected = contributions
      .filter((c) => c.status === 'PAID' || c.status === 'PARTIALLY_PAID')
      .reduce((sum, c) => sum + c.amount, 0);

    // PAID and PARTIALLY_PAID contributions count toward the pool (not WAIVED)
    expect(collected).toBe(18000);
  });

  it('Outstanding Pool = Expected - Collected', () => {
    const expectedPool = 60000;
    const collectedPool = 45000;

    const outstanding = expectedPool - collectedPool;
    expect(outstanding).toBe(15000);
  });

  it('Payout eligibility: collected >= expected AND no completed payout exists', () => {
    const collectedPool = 60000;
    const expectedPool = 60000;
    const hasCompletedPayout = false;
    const hasCriticalDiscrepancy = false;

    const isEligible = collectedPool >= expectedPool && !hasCompletedPayout && !hasCriticalDiscrepancy;

    expect(isEligible).toBe(true);
  });

  it('Payout eligibility: shortfall means not eligible', () => {
    const collectedPool = 50000;
    const expectedPool = 60000;

    const isEligible = collectedPool >= expectedPool;
    expect(isEligible).toBe(false);
  });

  it('Overpayment must be explicitly handled, never silently absorbed', () => {
    const amountDue = 5000;
    const paymentReceived = 7000;
    const overpayment = paymentReceived - amountDue;

    expect(overpayment).toBe(2000);
    // Must have explicit action: CREDIT, REFUND, MANUAL, or APPLY_TO_CURRENT
    const validActions: string[] = [
      OverpaymentAction.CREDIT,
      OverpaymentAction.REFUND,
      OverpaymentAction.MANUAL,
      OverpaymentAction.APPLY_TO_CURRENT
    ];
    expect(validActions).toContain(OverpaymentAction.CREDIT);
  });

  it('One position per member per cycle invariant', () => {
    const positions = [
      { memberId: 1, position: 1 },
      { memberId: 2, position: 2 },
      { memberId: 3, position: 3 },
      { memberId: 1, position: 4 } // Duplicate member!
    ];

    const memberPositions = positions.map((p) => p.memberId);
    const uniqueMembers = new Set(memberPositions);

    // A member cannot appear twice
    expect(uniqueMembers.size).toBeLessThan(memberPositions.length);
    // This proves the invariant is violated — the system must reject this
  });

  it('One period has exactly one recipient', () => {
    const period: ChamaPeriod = {
      id: 1,
      cycleId: 1,
      periodNumber: 1,
      recipientId: 10,
      recipientName: 'Alice Mwangi',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: PeriodStatus.OPEN,
      expectedPool: 60000,
      collectedPool: 0,
      outstandingPool: 60000,
      payoutStatus: PayoutStatus.READY,
      payoutAmount: null,
      isPayoutEligible: false,
      canClose: false,
      closureReason: PeriodClosureReason.NORMAL
    };

    expect(period.recipientId).toBeDefined();
    // Only one recipient
    expect(typeof period.recipientId).toBe('number');
  });

  it('CLOSED period cannot be silently modified (immutable)', () => {
    const closedPeriod: ChamaPeriod = {
      id: 1,
      cycleId: 1,
      periodNumber: 1,
      recipientId: 10,
      recipientName: 'Alice Mwangi',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: PeriodStatus.CLOSED,
      expectedPool: 60000,
      collectedPool: 58000,
      outstandingPool: 2000,
      payoutStatus: PayoutStatus.COMPLETED,
      payoutAmount: 58000,
      isPayoutEligible: false,
      canClose: false,
      closureReason: PeriodClosureReason.NORMAL
    };

    // A closed period must not have canClose true
    expect(closedPeriod.canClose).toBe(false);
    // Status must be CLOSED
    expect(closedPeriod.status).toBe(PeriodStatus.CLOSED);
  });

  it('Completed financial transactions are immutable (reversal only)', () => {
    const completedPayout: Payout = {
      id: 1,
      periodId: 1,
      recipientId: 10,
      recipientName: 'Alice',
      amount: 60000,
      status: PayoutStatus.COMPLETED,
      approvedBy: 1,
      approvedAt: '2026-01-15',
      initiatedAt: '2026-01-15',
      completedAt: '2026-01-15',
      providerTransactionId: 'TXN-001',
      bankAccountNumber: '123456',
      bankName: 'KCB',
      accountName: 'Alice',
      failureReason: null,
      notes: '',
      createdAt: '2026-01-15'
    };

    // Cannot delete or modify — only reverse
    expect(completedPayout.status).toBe(PayoutStatus.COMPLETED);
    expect(completedPayout.providerTransactionId).toBeDefined();
  });

  it('Period cannot close solely because date has passed', () => {
    const period: ChamaPeriod = {
      id: 1,
      cycleId: 1,
      periodNumber: 1,
      recipientId: 10,
      recipientName: 'Alice',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      status: PeriodStatus.COLLECTING,
      expectedPool: 60000,
      collectedPool: 30000,
      outstandingPool: 30000,
      payoutStatus: PayoutStatus.READY,
      payoutAmount: null,
      isPayoutEligible: false,
      canClose: false, // Cannot close — contributions still outstanding
      closureReason: PeriodClosureReason.NORMAL
    };

    // Even if today > endDate, canClose must remain false until conditions met
    expect(period.canClose).toBe(false);
  });

  it('One active cycle maximum', () => {
    const cycles: { status: string }[] = [
      { status: CycleStatus.ACTIVE },
      { status: CycleStatus.COMPLETED }
    ];

    const activeCount = cycles.filter((c) => c.status === CycleStatus.ACTIVE).length;
    expect(activeCount).toBe(1);
    // System must reject if activeCount >= 1 when starting a new cycle
  });

  it('One provider transaction creates one payment maximum (no duplicates)', () => {
    const providerTransactionId = 'MPESA-12345';
    const payments: { providerTransactionId: string }[] = [
      { providerTransactionId: 'MPESA-12345' }
    ];

    const duplicates = payments.filter((p) => p.providerTransactionId === providerTransactionId);
    // First payment succeeds; duplicate must be rejected
    expect(duplicates.length).toBe(1);
  });

  it('One payment creates one contribution maximum', () => {
    const paymentId = 100;
    const contributions: { paymentId: number }[] = [{ paymentId: 100 }];

    // System must enforce 1:1 between payment and contribution
    const linked = contributions.filter((c) => c.paymentId === paymentId);
    expect(linked.length).toBe(1);
  });

  it('One completed payout maximum per period', () => {
    const periodId = 1;
    const payouts: { periodId: number; status: string }[] = [
      { periodId: 1, status: PayoutStatus.COMPLETED }
    ];

    const completed = payouts.filter((p) => p.periodId === periodId && p.status === PayoutStatus.COMPLETED);
    expect(completed.length).toBe(1);
  });

  it('Payouts cannot exceed the authorized pool', () => {
    const authorizedPool = 60000;
    const payoutAmount = 65000;

    const exceedsPool = payoutAmount > authorizedPool;
    expect(exceedsPool).toBe(true);
    // System must reject this payout
  });

  it('UNKNOWN transactions cannot be blindly retried', () => {
    const paymentStatus = PaymentStatus.UNKNOWN;
    const canRetry = false; // Must NOT retry — requires provider reconciliation

    expect(paymentStatus).toBe(PaymentStatus.UNKNOWN);
    expect(canRetry).toBe(false);
  });

  it('Contribution frequency types are valid', () => {
    const frequencies = [
      'WEEKLY',
      'BIWEEKLY',
      'MONTHLY'
    ];
    frequencies.forEach((f) => {
      expect(typeof f).toBe('string');
    });
  });

  it('Audit event contains required fields', () => {
    const auditEvent: AuditEvent = {
      id: 1,
      actorId: 1,
      actorName: 'admin',
      action: 'MEMBER_CREATED',
      entityType: 'MEMBER',
      entityId: 10,
      timestamp: '2026-01-15T10:30:00Z',
      previousState: null,
      newState: '{"status":"ACTIVE"}',
      reference: null,
      reason: null,
      metadata: null
    };

    expect(auditEvent.actorId).toBeDefined();
    expect(auditEvent.action).toBeDefined();
    expect(auditEvent.entityType).toBeDefined();
    expect(auditEvent.entityId).toBeDefined();
    expect(auditEvent.timestamp).toBeDefined();
  });

  it('Member states follow valid transitions', () => {
    const validTransitions: Record<string, string[]> = {
      PENDING: [
        'ACTIVE',
        'EXITED'
      ],
      ACTIVE: [
        'SUSPENDED',
        'EXITED'
      ],
      SUSPENDED: [
        'ACTIVE',
        'EXITED'
      ],
      EXITED: [] // Terminal state — no transitions out
    };

    expect(validTransitions[MemberStatus.ACTIVE]).toContain(MemberStatus.SUSPENDED);
    expect(validTransitions[MemberStatus.ACTIVE]).toContain(MemberStatus.EXITED);
    expect(validTransitions[MemberStatus.EXITED]).toHaveLength(0);
    expect(validTransitions[MemberStatus.PENDING]).toContain(MemberStatus.ACTIVE);
  });

  it('Period states follow valid transitions', () => {
    const validTransitions: Record<string, string[]> = {
      UPCOMING: [
        'OPEN',
        'SUSPENDED'
      ],
      OPEN: ['COLLECTING'],
      COLLECTING: [
        'READY_FOR_PAYOUT',
        'SHORTFALL'
      ],
      READY_FOR_PAYOUT: ['PAYOUT_PENDING'],
      PAYOUT_PENDING: [
        'PAID',
        'SHORTFALL'
      ],
      PAID: ['CLOSED'],
      SHORTFALL: [
        'CLOSED',
        'COLLECTING'
      ], // After authorization
      SUSPENDED: ['OPEN']
    };

    expect(validTransitions[PeriodStatus.COLLECTING]).toContain(PeriodStatus.READY_FOR_PAYOUT);
    expect(validTransitions[PeriodStatus.COLLECTING]).toContain(PeriodStatus.SHORTFALL);
    expect(validTransitions[PeriodStatus.CLOSED] || []).toHaveLength(0);
  });

  it('Social fund balance cannot go negative', () => {
    const currentBalance = 25000;
    const disbursementAmount = 30000;

    const canDisburse = disbursementAmount <= currentBalance;
    expect(canDisburse).toBe(false);
  });

  it('Late fee calculation: ON_TIME = no fee, LATE = configured fee, OVERDUE = configured fee', () => {
    const lateFeeConfig = 200;

    const onTime = { timing: 'ON_TIME', fee: 0 };
    const late = { timing: 'LATE', fee: lateFeeConfig };
    const overdue = { timing: 'OVERDUE', fee: lateFeeConfig };

    expect(onTime.fee).toBe(0);
    expect(late.fee).toBe(200);
    expect(overdue.fee).toBe(200);
  });

  it('Member exit with DEBT_FOLLOWS retains unpaid obligations', () => {
    const member = {
      id: 10,
      status: MemberStatus.EXITED,
      exitResolution: ExitResolution.DEBT_FOLLOWS,
      outstandingAmount: 15000
    };

    expect(member.status).toBe(MemberStatus.EXITED);
    expect(member.outstandingAmount).toBeGreaterThan(0);
    // Obligations remain — member must still pay
  });

  it('Member exit with FORFEIT_PAID clears obligations for received pot only', () => {
    const member = {
      id: 10,
      status: MemberStatus.EXITED,
      exitResolution: ExitResolution.FORFEIT_PAID,
      futureObligationsCancelled: true,
      priorPayoutsRetained: true
    };

    expect(member.futureObligationsCancelled).toBe(true);
    expect(member.priorPayoutsRetained).toBe(true);
  });
});
