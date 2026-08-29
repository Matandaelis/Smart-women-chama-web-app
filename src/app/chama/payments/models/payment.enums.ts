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

// ── Payment Provider ──────────────────────────────────────────
// Identifies which payment provider/rail processed the transaction.
export enum PaymentProvider {
  /** Safaricom Daraja — STK Push, C2B, B2C, B2B */
  MPESA_DARAJA = 'MPESA_DARAJA',
  /** Pesapal — unified M-Pesa + cards + bank transfers */
  PESAPAL = 'PESAPAL',
  /** IntaSend — Kenya-focused, STK Push + B2C + bank */
  INTASEND = 'INTASEND',
  /** Equity Bank Jenga API — PGW for cards + M-Pesa + bank */
  EQUITY_JENGA = 'EQUITY_JENGA',
  /** KCB Buni API — IPN, Lipa na KCB, PesaLink */
  KCB_BUNI = 'KCB_BUNI',
  /** Co-operative Bank COOP Connect — PesaLink, payment APIs */
  COOP_CONNECT = 'COOP_CONNECT',
  /** PesaLink — Kenya Bankers Association inter-bank rail */
  PESALINK = 'PESALINK',
  /** RTGS — Real-Time Gross Settlement (high-value) */
  RTGS = 'RTGS',
  /** EFT — Electronic Funds Transfer (batch) */
  EFT = 'EFT',
  /** Manual / Cash / Other */
  MANUAL = 'MANUAL'
}

// ── M-Pesa Transaction Status ─────────────────────────────────
// Maps to Daraja API response codes and callback ResultCode values.
export enum MpesaTransactionStatus {
  /** Transaction completed successfully */
  SUCCESS = '0',
  /** Insufficient balance */
  INSUFFICIENT_BALANCE = '1',
  /** Less than minimum transaction value */
  LESS_THAN_MIN_TRANSACTION = '2',
  /** More than maximum transaction value */
  MORE_THAN_MAX_TRANSACTION = '3',
  /** Would exceed daily limit */
  DAILY_LIMIT_EXCEEDED = '4',
  /** Account does not exist */
  ACCOUNT_DOES_NOT_EXIST = '5',
  /** Transaction timed out */
  TIMEOUT = '1032',
  /** User cancelled the STK Push prompt */
  CANCELLED_BY_USER = '1033',
  /** Invalid amount */
  INVALID_AMOUNT = '1034',
  /** Account is locked */
  ACCOUNT_LOCKED = '1035',
  /** Transaction not found */
  NOT_FOUND = '1036',
  /** Initiator is not authorized */
  NOT_AUTHORIZED = '1037',
  /** Duplicate transaction reference */
  DUPLICATE_REFERENCE = '1039',
  /** Originator timeout */
  ORIGINATOR_TIMEOUT = '2001',
  /** Paybill not found */
  PAYBILL_NOT_FOUND = '2026',
  /** STK Push failed */
  STK_PUSH_FAILED = '2027'
}

// ── STK Push Request Status ───────────────────────────────────
// Tracks the lifecycle of an STK Push initiated via Daraja.
export enum StkPushStatus {
  /** STK Push sent to member's phone, awaiting PIN entry */
  INITIATED = 'INITIATED',
  /** Member entered PIN, transaction processing */
  PROCESSING = 'PROCESSING',
  /** Transaction completed successfully */
  COMPLETED = 'COMPLETED',
  /** Member cancelled or entered wrong PIN */
  FAILED = 'FAILED',
  /** No response within timeout window */
  TIMEOUT = 'TIMEOUT',
  /** Status unknown — requires polling for resolution */
  UNKNOWN = 'UNKNOWN'
}

// ── C2B (Customer to Business) Transaction Type ───────────────
export enum C2BTransactionType {
  /** Customer paid via Paybill number + account reference */
  PAYBILL = 'PAYBILL',
  /** Customer paid via Till/Buy Goods number */
  BUY_GOODS = 'BUY_GOODS'
}

// ── B2C (Business to Customer) Payment Type ───────────────────
// Used for Chama payouts to member M-Pesa wallets.
export enum B2CPaymentType {
  /** Business-initiated payment to customer (payout) */
  BUSINESS_PAYMENT = 'BusinessPayment',
  /** Salary payment */
  SALARY_PAYMENT = 'SalaryPayment',
  /** Government-to-citizen payment */
  GOVERNMENT_PAYMENT = 'GovernmentPayment',
  /** Promotion/payment for raffle or contest */
  PROMOTIONAL_PAYMENT = 'PromotionPayment'
}

// ── B2C Result Status ─────────────────────────────────────────
export enum B2CResultStatus {
  /** Payment completed successfully */
  COMPLETED = 'Completed',
  /** Payment is being processed */
  PROCESSING = 'Processing',
  /** Payment failed */
  FAILED = 'Failed',
  /** Partially completed (rare) */
  PARTIALLY_COMPLETED = 'PartiallyCompleted'
}

// ── Gateway Transaction Status ────────────────────────────────
// Unified status across all payment providers.
export enum GatewayTransactionStatus {
  /** Transaction initiated, awaiting provider processing */
  INITIATED = 'INITIATED',
  /** Provider is processing the transaction */
  PROCESSING = 'PROCESSING',
  /** Transaction completed successfully */
  SUCCESS = 'SUCCESS',
  /** Transaction failed */
  FAILED = 'FAILED',
  /** Transaction timed out — requires reconciliation */
  TIMEOUT = 'TIMEOUT',
  /** Status unknown — requires manual investigation */
  UNKNOWN = 'UNKNOWN',
  /** Transaction was reversed/refunded */
  REVERSED = 'REVERSED',
  /** Transaction was refunded */
  REFUNDED = 'REFUNDED',
  /** Awaiting user action (e.g., STK Push PIN entry) */
  PENDING_USER_ACTION = 'PENDING_USER_ACTION'
}

// ── Payment Method (from member's perspective) ────────────────
export enum PaymentMethod {
  /** M-Pesa STK Push — system initiates prompt on member's phone */
  MPESA_STK_PUSH = 'MPESA_STK_PUSH',
  /** M-Pesa Paybill — member sends money manually to paybill + account */
  MPESA_PAYBILL = 'MPESA_PAYBILL',
  /** M-Pesa Till — member pays to till number */
  MPESA_TILL = 'MPESA_TILL',
  /** M-Pesa Send Money — member sends to a number */
  MPESA_SEND_MONEY = 'MPESA_SEND_MONEY',
  /** Bank transfer via PesaLink */
  BANK_PESALINK = 'BANK_PESALINK',
  /** Bank transfer via RTGS (high value) */
  BANK_RTGS = 'BANK_RTGS',
  /** Bank transfer via EFT */
  BANK_EFT = 'BANK_EFT',
  /** Card payment (Visa, Mastercard) via gateway */
  CARD = 'CARD',
  /** Cash payment (recorded manually) */
  CASH = 'CASH',
  /** Other payment method */
  OTHER = 'OTHER'
}

// ── Reconciliation Status (enhanced) ──────────────────────────
export enum PaymentReconciliationStatus {
  /** Transaction matched between internal record and provider statement */
  MATCHED = 'MATCHED',
  /** Transaction found in internal records but not in provider statement */
  INTERNAL_ONLY = 'INTERNAL_ONLY',
  /** Transaction found in provider statement but not in internal records */
  PROVIDER_ONLY = 'PROVIDER_ONLY',
  /** Amount mismatch between internal and provider records */
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  /** Duplicate transaction detected */
  DUPLICATE = 'DUPLICATE',
  /** Transaction pending investigation */
  PENDING_REVIEW = 'PENDING_REVIEW',
  /** Transaction resolved after investigation */
  RESOLVED = 'RESOLVED',
  /** Transaction reversed */
  REVERSED = 'REVERSED'
}

// ── Provider Environment ──────────────────────────────────────
export enum ProviderEnvironment {
  /** Safaricom sandbox / provider test environment */
  SANDBOX = 'SANDBOX',
  /** Live production environment */
  PRODUCTION = 'PRODUCTION'
}

// ── PesaLink Transfer Type ────────────────────────────────────
export enum PesaLinkTransferType {
  /** Transfer to another bank account */
  BANK_TRANSFER = 'BANK_TRANSFER',
  /** Transfer to mobile number */
  MOBILE_TRANSFER = 'MOBILE_TRANSFER'
}
