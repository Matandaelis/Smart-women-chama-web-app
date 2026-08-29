/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  MemberStatus,
  CycleStatus,
  RotationMethod,
  PeriodStatus,
  ContributionStatus,
  PaymentStatus,
  PayoutStatus,
  ReconciliationStatus,
  PaymentTiming,
  ContributionFrequency
} from './chama.enums';

// ── Chama Configuration ───────────────────────────────────────
export interface ChamaConfiguration {
  id: number;
  name: string;
  currency: string; // KES
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  cycleStartDate: string;
  activeMemberCount: number;
  rotationMethod: RotationMethod;
  currentPeriodNumber: number;
  currentRecipientId: number;
  payoutPolicy: PayoutPolicy;
  latePaymentPolicy: LatePaymentPolicy;
  approvalRequiredForPayout: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutPolicy {
  requireFullPool: boolean;
  allowPartialPayout: boolean;
  approvalThreshold: number;
}

export interface LatePaymentPolicy {
  enabled: boolean;
  gracePeriodDays: number;
  lateFeeAmount: number;
  lateFeeType: 'FIXED' | 'PERCENTAGE';
}

// ── Member ────────────────────────────────────────────────────
export interface ChamaMember {
  id: number;
  membershipNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  status: MemberStatus;
  joinedDate: string;
  exitedDate: string | null;
  suspendedDate: string | null;
  payoutAccountNumber: string;
  payoutAccountBank: string;
  payoutAccountName: string;
  currentPosition: number | null;
  totalContributionsMade: number;
  totalPayoutsReceived: number;
  outstandingBalance: number;
}

export interface MemberCreateRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  payoutAccountNumber: string;
  payoutAccountBank: string;
  payoutAccountName: string;
}

export interface MemberStatusChangeRequest {
  memberId: number;
  newStatus: MemberStatus;
  reason: string;
}

// ── Cycle & Rotation ──────────────────────────────────────────
export interface ChamaCycle {
  id: number;
  cycleNumber: number;
  status: CycleStatus;
  startDate: string;
  endDate: string | null;
  totalPositions: number;
  activeMemberCount: number;
  rotationMethod: RotationMethod;
  currentPeriodNumber: number;
}

export interface RotationPosition {
  id: number;
  cycleId: number;
  position: number;
  memberId: number;
  memberName: string;
  periodId: number;
  periodNumber: number;
}

// ── Period ────────────────────────────────────────────────────
export interface ChamaPeriod {
  id: number;
  cycleId: number;
  periodNumber: number;
  recipientId: number;
  recipientName: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  expectedPool: number;
  collectedPool: number;
  outstandingPool: number;
  payoutStatus: PayoutStatus;
  payoutAmount: number | null;
  isPayoutEligible: boolean;
}

export interface PeriodSummary {
  periodId: number;
  totalRequirements: number;
  paidCount: number;
  partiallyPaidCount: number;
  overdueCount: number;
  waivedCount: number;
  collectionRate: number;
}

// ── Contribution ──────────────────────────────────────────────
export interface ContributionRequirement {
  id: number;
  memberId: number;
  memberName: string;
  periodId: number;
  periodNumber: number;
  amountDue: number;
  amountPaid: number;
  outstandingAmount: number;
  lateFees: number;
  dueDate: string;
  lastPaymentDate: string | null;
  status: ContributionStatus;
  paymentTiming: PaymentTiming;
}

export interface ContributionPayment {
  id: number;
  contributionId: number;
  memberId: number;
  periodId: number;
  amount: number;
  paymentDate: string;
  providerTransactionId: string;
  paymentMethod: string;
  status: PaymentStatus;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface PaymentRequest {
  memberId: number;
  periodId: number;
  amount: number;
  paymentMethod: string;
  providerTransactionId: string;
  reference: string;
  notes: string;
}

// ── Pool ──────────────────────────────────────────────────────
export interface PoolStatus {
  periodId: number;
  expectedPool: number;
  collectedPool: number;
  outstandingPool: number;
  totalRequirements: number;
  fundedRequirements: number;
  isFullyFunded: boolean;
  isPayoutEligible: boolean;
  shortfallAmount: number;
}

// ── Payout ────────────────────────────────────────────────────
export interface Payout {
  id: number;
  periodId: number;
  recipientId: number;
  recipientName: string;
  amount: number;
  status: PayoutStatus;
  approvedBy: number | null;
  approvedAt: string | null;
  initiatedAt: string | null;
  completedAt: string | null;
  providerTransactionId: string | null;
  bankAccountNumber: string;
  bankName: string;
  accountName: string;
  failureReason: string | null;
  notes: string;
  createdAt: string;
}

export interface PayoutApprovalRequest {
  payoutId: number;
  approved: boolean;
  notes: string;
}

// ── Reconciliation ────────────────────────────────────────────
export interface ReconciliationRecord {
  id: number;
  periodId: number;
  transactionType: 'CONTRIBUTION' | 'PAYOUT' | 'FEE';
  internalPaymentId: number;
  providerTransactionId: string;
  expectedAmount: number;
  actualAmount: number;
  status: ReconciliationStatus;
  discrepancyType: string | null;
  notes: string;
  resolvedBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
}

// ── Audit ─────────────────────────────────────────────────────
export interface AuditEvent {
  id: number;
  actorId: number;
  actorName: string;
  action: string;
  entityType: string;
  entityId: number;
  previousState: string | null;
  newState: string | null;
  reference: string | null;
  reason: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

// ── Governance ────────────────────────────────────────────────
export interface GovernanceMeeting {
  id: number;
  meetingDate: string;
  title: string;
  description: string;
  attendees: MeetingAttendee[];
  resolutions: Resolution[];
  createdAt: string;
}

export interface MeetingAttendee {
  memberId: number;
  memberName: string;
  attended: boolean;
}

export interface Resolution {
  id: number;
  meetingId: number;
  title: string;
  description: string;
  proposedBy: number;
  proposedByName: string;
  voteResult: 'APPROVED' | 'REJECTED' | 'PENDING';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
}

// ── Dashboard ─────────────────────────────────────────────────
export interface ChamaDashboard {
  configuration: ChamaConfiguration;
  activeCycle: ChamaCycle | null;
  currentPeriod: ChamaPeriod | null;
  totalMembers: number;
  activeMembers: number;
  totalContributions: number;
  totalPayouts: number;
  outstandingAmount: number;
  nextRecipient: ChamaMember | null;
  recentPayments: ContributionPayment[];
  recentAuditEvents: AuditEvent[];
}

// ── API Response Wrappers ─────────────────────────────────────
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
