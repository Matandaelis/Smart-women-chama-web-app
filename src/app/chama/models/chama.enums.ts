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

// ── Member States ──────────────────────────────────────────────
export enum MemberStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXITED = 'EXITED'
}

// ── Cycle / Rotation ──────────────────────────────────────────
export enum CycleStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RotationMethod {
  FIXED = 'FIXED',
  LOTTERY = 'LOTTERY',
  VOLUNTEER = 'VOLUNTEER'
}

// ── Period States ─────────────────────────────────────────────
export enum PeriodStatus {
  UPCOMING = 'UPCOMING',
  OPEN = 'OPEN',
  COLLECTING = 'COLLECTING',
  READY_FOR_PAYOUT = 'READY_FOR_PAYOUT',
  PAYOUT_PENDING = 'PAYOUT_PENDING',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
  SHORTFALL = 'SHORTFALL',
  SUSPENDED = 'SUSPENDED'
}

// ── Contribution Requirement Status ───────────────────────────
export enum ContributionStatus {
  DUE = 'DUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
  CANCELLED = 'CANCELLED'
}

// ── Payment States ────────────────────────────────────────────
export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  UNKNOWN = 'UNKNOWN',
  REVERSED = 'REVERSED',
  REFUNDED = 'REFUNDED'
}

// ── Payout States ─────────────────────────────────────────────
export enum PayoutStatus {
  READY = 'READY',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  INITIATING = 'INITIATING',
  PROVIDER_PENDING = 'PROVIDER_PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  UNKNOWN = 'UNKNOWN',
  REVERSED = 'REVERSED'
}

// ── Reconciliation Status ─────────────────────────────────────
export enum ReconciliationStatus {
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  DUPLICATE = 'DUPLICATE',
  UNKNOWN = 'UNKNOWN',
  REVERSED = 'REVERSED'
}

// ── Payment Timing ────────────────────────────────────────────
export enum PaymentTiming {
  ON_TIME = 'ON_TIME',
  LATE = 'LATE',
  OVERDUE = 'OVERDUE'
}

// ── Frequency ─────────────────────────────────────────────────
export enum ContributionFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY'
}
