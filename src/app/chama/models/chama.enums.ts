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

// ── Overpayment Handling ──────────────────────────────────────
// Applied when a member pays more than the contribution amount due.
export enum OverpaymentAction {
  /** Hold as credit toward future periods */
  CREDIT = 'CREDIT',
  /** Apply as extra contribution to current period */
  APPLY_TO_CURRENT = 'APPLY_TO_CURRENT',
  /** Return to member as refund */
  REFUND = 'REFUND',
  /** Require manual admin resolution */
  MANUAL = 'MANUAL'
}

// ── Member Exit Resolution ────────────────────────────────────
// How an exiting member's remaining obligations are handled.
export enum ExitResolution {
  /** Exit after receiving payout: member still owes remaining periods */
  DEBT_FOLLOWS = 'DEBT_FOLLOWS',
  /** Exit before receiving: contributions already paid become forfeited */
  FORFEIT_PAID = 'FORFEIT_PAID',
  /** Replacement member takes over remaining obligations */
  REPLACED = 'REPLACED',
  /** Member pays buy-in for remaining periods and exits cleanly */
  BUYOUT = 'BUYOUT'
}

// ── Period Closure Reason ─────────────────────────────────────
// Required when closing a period that isn't in normal PAID state.
// ── Member Roles ────────────────────────────────────────────
// Maps to dt_member_role custom data table.
// Different roles carry different permissions (e.g., Treasurer can record
// payments, Chairperson can approve loans).
export enum MemberRole {
  /** Default role for all members */
  MEMBER = 'MEMBER',
  /** Treasurer records payments, manages collection sheets */
  TREASURER = 'TREASURER',
  /** Secretary records minutes, manages meeting notes */
  SECRETARY = 'SECRETARY',
  /** Chairperson conducts meetings, approves motions */
  CHAIRPERSON = 'CHAIRPERSON',
  /** Loan officer manages loan applications and approvals */
  LOAN_OFFICER = 'LOAN_OFFICER'
}

// ── Meeting Status ───────────────────────────────────────────
// Maps to dt_meeting_record custom data table.
export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// ── Social Fund Purpose ─────────────────────────────────────
// Maps to dt_social_fund custom data table.
// Social fund is a separate pool within the chama for community welfare.
export enum SocialFundPurpose {
  EMERGENCY = 'EMERGENCY',
  FUNERAL = 'FUNERAL',
  WEDDING = 'WEDDING',
  MEDICAL = 'MEDICAL',
  EDUCATION = 'EDUCATION',
  BEREAVEMENT = 'BEREAVEMENT',
  CELEBRATION = 'CELEBRATION',
  OTHER = 'OTHER'
}

// ── Loan Vote Result ────────────────────────────────────────
// Maps to dt_loan_vote custom data table.
export enum LoanVoteResult {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING'
}

// ── Share-Out Calculation Method ─────────────────────────────
// Maps to dt_share_out custom data table.
export enum ShareOutMethod {
  /** Equal share: total surplus / active members */
  EQUAL = 'EQUAL',
  /** Proportional: based on contribution percentage */
  PROPORTIONAL = 'PROPORTIONAL',
  /** Hybrid: equal base + proportional bonus */
  HYBRID = 'HYBRID'
}

// ── Period Closure Reason ─────────────────────────────────────
export enum PeriodClosureReason {
  /** All contributions paid, payout completed — normal closure */
  NORMAL = 'NORMAL',
  /** Closed with outstanding shortfall after admin authorization */
  SHORTFALL_AUTHORIZED = 'SHORTFALL_AUTHORIZED',
  /** Recipient waived payout (rare but used in some chamas) */
  PAYOUT_WAIVED = 'PAYOUT_WAIVED',
  /** Member defaulted and period forcibly closed */
  MEMBER_DEFAULT = 'MEMBER_DEFAULT'
}
