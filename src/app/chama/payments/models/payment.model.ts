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
  PaymentProvider,
  PaymentMethod,
  GatewayTransactionStatus,
  PaymentReconciliationStatus,
  StkPushStatus,
  B2CPaymentType,
  B2CResultStatus,
  C2BTransactionType,
  ProviderEnvironment,
  PesaLinkTransferType
} from './payment.enums';

// ── Provider Configuration ────────────────────────────────────
// Stores credentials and configuration for each payment provider.
// Secrets are never stored in code — this is the schema for runtime config.
export interface PaymentProviderConfig {
  id: string;
  provider: PaymentProvider;
  environment: ProviderEnvironment;
  isActive: boolean;
  /** Provider-specific API base URL */
  apiUrl: string;
  /** Whether this provider can collect payments (inbound) */
  canCollect: boolean;
  /** Whether this provider can disburse payments (outbound) */
  canDisburse: boolean;
  /** Supported payment methods for this provider */
  supportedMethods: PaymentMethod[];
  /** Transaction fee configuration */
  feeConfig: PaymentFeeConfig;
  /** Rate limits */
  rateLimit: PaymentRateLimit;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFeeConfig {
  /** Fixed fee per transaction in KES */
  fixedFee: number;
  /** Percentage fee (e.g., 0.025 = 2.5%) */
  percentageFee: number;
  /** Minimum fee in KES */
  minimumFee: number;
  /** Maximum fee in KES */
  maximumFee: number;
  /** VAT on fees (e.g., 0.16 = 16% VAT) */
  vatRate: number;
}

export interface PaymentRateLimit {
  /** Max transactions per minute */
  perMinute: number;
  /** Max transactions per day */
  perDay: number;
  /** Max amount per transaction in KES */
  maxPerTransaction: number;
  /** Max cumulative amount per day in KES */
  maxPerDay: number;
}

// ── M-Pesa Daraja Models ──────────────────────────────────────

/** STK Push request — initiated by Chama to collect contribution */
export interface MpesaStkPushRequest {
  /** Member's M-Pesa registered phone number (254XXXXXXXXX) */
  phoneNumber: string;
  /** Amount to collect */
  amount: number;
  /** Account reference (e.g., "CHAMA-M12-P01" for member 12, period 1) */
  accountReference: string;
  /** Transaction description */
  transactionDescription: string;
}

/** STK Push response from Daraja */
export interface MpesaStkPushResponse {
  /** Merchant request ID — unique ID for the STK Push request */
  merchantRequestId: string;
  /** Checkout request ID — unique ID for the checkout session */
  checkoutRequestId: string;
  /** Response code: 0 = success, non-zero = failure */
  responseCode: string;
  /** Response description */
  responseDescription: string;
  /** Customer message displayed to user */
  customerMessage: string;
}

/** STK Push callback from Safaricom (sent to your webhook) */
export interface MpesaStkCallback {
  /** Merchant request ID — matches the original request */
  merchantRequestId: string;
  /** Checkout request ID */
  checkoutRequestId: string;
  /** Result code: 0 = success */
  resultCode: string;
  /** Result description */
  resultDesc: string;
  /** Amount paid */
  amount: number;
  /** M-Pesa receipt/transaction number */
  mpesaReceiptNumber: string;
  /** Phone number used */
  phoneNumber: string;
  /** Transaction date (YYYYMMDDHHmmss) */
  transactionDate: string;
  /** Account reference from the original request */
  accountReference: string;
}

/** C2B (Customer to Business) callback — member sends money to paybill */
export interface MpesaC2BCallback {
  /** Transaction type: PayBill or BuyGoods */
  transactionType: C2BTransactionType;
  /** M-Pesa transaction number */
  transID: string;
  /** Transaction amount */
  transAmount: number;
  /** Short code (paybill/till number) */
  businessShortCode: string;
  /** Phone number */
  msisdn: string;
  /** Account reference (member-entered) */
  accountNumber: string;
  /** Transaction timestamp */
  transactionTimestamp: string;
  /** Whether this is a validation or confirmation callback */
  callbackType: 'validation' | 'confirmation';
  /** Amount paid after deductions (e.g., after fees) */
  orgAccountBalance?: number;
  /** Third-party transaction ID */
  thirdPartyTransID?: string;
}

/** B2C (Business to Customer) payout request — Chama sends payout to member */
export interface MpesaB2CPaymentRequest {
  /** Recipient's M-Pesa phone number (254XXXXXXXXX) */
  phoneNumber: string;
  /** Payout amount */
  amount: number;
  /** Payment type */
  paymentType: B2CPaymentType;
  /** Unique identifier from Chama (e.g., payout ID) */
  occasion: string;
  /** Remarks/description */
  remarks: string;
}

/** B2C payment response from Daraja */
export interface MpesaB2CPaymentResponse {
  /** Conversation ID */
  conversationId: string;
  /** Originator conversation ID */
  originatorConversationId: string;
  /** Response code */
  responseCode: string;
  /** Response description */
  responseDescription: string;
}

/** B2C callback — notification of payout result */
export interface MpesaB2CCallback {
  /** Result status: Completed, Failed, Processing */
  resultStatus: B2CResultStatus;
  /** Result code */
  resultCode: string;
  /** Result description */
  resultDesc: string;
  /** Originator conversation ID */
  originatorConversationID: string;
  /** Unique request ID */
  uniqueRequestID: string;
  /** Transaction ID (if completed) */
  transactionID?: string;
  /** Transaction amount */
  transactionAmount?: number;
  /** Receiver phone number */
  receiverPartyPublicID?: string;
  /** M-Pesa account balance after transaction */
  accountBalance?: string;
  /** Transaction timestamp */
  timestamp: string;
}

// ── Unified Gateway Models ─────────────────────────────────────

/** Unified payment initiation request (provider-agnostic) */
export interface PaymentInitiationRequest {
  /** Amount in KES */
  amount: number;
  /** Payment method chosen by member */
  paymentMethod: PaymentMethod;
  /** Member ID from Chama */
  memberId: number;
  /** Contribution period ID (for contribution payments) */
  periodId?: number;
  /** Payout ID (for receiving payouts) */
  payoutId?: number;
  /** Account reference for the provider */
  accountReference: string;
  /** Description */
  description: string;
  /** Callback/webhook URL */
  callbackUrl?: string;
  /** Member's phone number (for M-Pesa) */
  phoneNumber?: string;
  /** Member's bank account (for bank transfers) */
  bankAccountNumber?: string;
  /** Bank code (for bank transfers) */
  bankCode?: string;
  /** Provider-specific metadata */
  metadata?: Record<string, string>;
}

/** Unified payment response from any provider */
export interface PaymentInitiationResponse {
  /** Unique transaction ID in Chama system */
  chamaTransactionId: string;
  /** Provider's transaction reference */
  providerTransactionId: string;
  /** Provider-specific checkout/request ID */
  providerCheckoutId?: string;
  /** Current status */
  status: GatewayTransactionStatus;
  /** Payment provider used */
  provider: PaymentProvider;
  /** Amount */
  amount: number;
  /** Any message from provider */
  message?: string;
  /** Redirect URL (for card payments) */
  redirectUrl?: string;
  /** QR code data (for QR payments) */
  qrCode?: string;
}

/** Unified payment status query response */
export interface PaymentStatusResponse {
  /** Chama transaction ID */
  chamaTransactionId: string;
  /** Provider transaction ID */
  providerTransactionId: string;
  /** Provider */
  provider: PaymentProvider;
  /** Current status */
  status: GatewayTransactionStatus;
  /** M-Pesa receipt number (if M-Pesa) */
  mpesaReceiptNumber?: string;
  /** Amount */
  amount: number;
  /** When status was last updated */
  statusUpdatedAt: string;
  /** Provider's raw response */
  rawResponse?: Record<string, unknown>;
}

/** Unified reconciliation record — matches provider statement to internal record */
export interface PaymentReconciliationRecord {
  id: number;
  /** Chama internal transaction ID */
  chamaTransactionId: string;
  /** Provider transaction ID */
  providerTransactionId: string;
  /** Payment provider */
  provider: PaymentProvider;
  /** Internal amount (what Chama recorded) */
  internalAmount: number;
  /** Provider amount (what provider statement shows) */
  providerAmount: number;
  /** Whether amounts match */
  amountsMatch: boolean;
  /** Reconciliation status */
  status: PaymentReconciliationStatus;
  /** Payment method used */
  paymentMethod: PaymentMethod;
  /** Phone number or account */
  payerReference: string;
  /** Transaction timestamp from provider */
  providerTimestamp: string;
  /** Internal recording timestamp */
  internalTimestamp: string;
  /** M-Pesa receipt (if applicable) */
  mpesaReceiptNumber?: string;
  /** Notes from manual review */
  notes?: string;
  /** Resolved by (user ID) */
  resolvedBy?: number;
  /** Resolution timestamp */
  resolvedAt?: string;
  createdAt: string;
}

// ── Pesapal Models ────────────────────────────────────────────

/** Pesapal order request */
export interface PesapalOrderRequest {
  amount: number;
  description: string;
  type: 'MERCHANT' | 'OTHER';
  /** Unique reference from Chama */
  reference: string;
  /** Member's name */
  firstName: string;
  lastName: string;
  email: string;
  /** Phone for M-Pesa */
  phoneNumber?: string;
  /** Callback URL after payment */
  callbackUrl: string;
}

/** Pesapal order response */
export interface PesapalOrderResponse {
  orderTrackingId: string;
  merchantReference: string;
  redirectUrl: string;
  responseStatus: { code: number; description: string };
}

/** Pesapal transaction status */
export interface PesapalTransactionStatus {
  orderTrackingId: string;
  merchantReference: string;
  status: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  createdAt: string;
}

// ── IntaSend Models ───────────────────────────────────────────

/** IntaSend payment request */
export interface IntaSendPaymentRequest {
  amount: number;
  currency: string; // KES
  /** Payment method: MPESA_STK, CARD, BANK */
  paymentMethod: string;
  /** Phone for M-Pesa */
  phoneNumber?: string;
  /** Email for card */
  email?: string;
  /** Narrative/description */
  narrative: string;
  /** Unique reference */
  reference: string;
  /** Webhook URL */
  webhookUrl: string;
}

/** IntaSend payment response */
export interface IntaSendPaymentResponse {
  id: string;
  status: string;
  paymentLink?: string;
  challenge?: string;
}

/** IntaSend B2C payout request */
export interface IntaSendB2CRequest {
  /** Destination phone number */
  destination: string;
  /** Amount */
  amount: number;
  /** Currency */
  currency: string;
  /** Narrative */
  narrative: string;
  /** External reference */
  reference: string;
}

/** IntaSend webhook payload */
export interface IntaSendWebhook {
  id: string;
  status: string;
  amount: number;
  currency: string;
  api_ref: string;
  account: string;
  /** M-Pesa receipt */
  mpesa_receipt?: string;
  created_at: string;
  updated_at: string;
}

// ── KCB Buni Models ───────────────────────────────────────────

/** KCB IPN (Instant Payment Notification) callback */
export interface KcbIpnCallback {
  /** KCB transaction reference */
  transactionRef: string;
  /** Amount received */
  amount: number;
  /** Account reference (member-entered) */
  accountNumber: string;
  /** Phone number */
  phoneNumber: string;
  /** Transaction date */
  transactionDate: string;
  /** KCB short code */
  shortCode: string;
  /** Transaction type (Paybill/BuyGoods) */
  transactionType: string;
}

/** KCB Buni payment initiation */
export interface KcbPaymentRequest {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  description: string;
}

/** KCB Buni transfer request (for payouts) */
export interface KcbTransferRequest {
  amount: number;
  destinationAccount: string;
  destinationBankCode: string;
  reference: string;
  description: string;
}

// ── Equity Jenga Models ───────────────────────────────────────

/** Equity Jenga PGW payment request */
export interface JengaPaymentRequest {
  /** Amount */
  amount: number;
  /** Currency (KES) */
  currency: string;
  /** Payment method: MPESA, CARD, BANK_ACCOUNT */
  paymentMethod: string;
  /** Phone number for M-Pesa */
  phoneNumber?: string;
  /** Bank account number for bank transfer */
  bankAccount?: string;
  /** Bank code for bank transfer */
  bankCode?: string;
  /** Reference */
  reference: string;
  /** Description */
  description: string;
  /** Callback URL */
  callbackUrl: string;
}

/** Equity Jenga payment response */
export interface JengaPaymentResponse {
  transactionId: string;
  status: string;
  /** 3D Secure redirect URL (for cards) */
  redirectUrl?: string;
  /** Transaction reference */
  reference: string;
}

/** Equity Jenga account query response */
export interface JengaAccountBalance {
  accountNumber: string;
  accountName: string;
  availableBalance: number;
  currency: string;
}

// ── PesaLink Models ───────────────────────────────────────────

/** PesaLink transfer request */
export interface PesaLinkTransferRequest {
  amount: number;
  /** Destination bank code (e.g., "01" for KCB, "12" for Equity) */
  destinationBankCode: string;
  /** Destination account number */
  destinationAccountNumber: string;
  /** Destination name (for confirmation) */
  destinationAccountName?: string;
  /** Transfer type */
  transferType: PesaLinkTransferType;
  /** Phone number (for mobile transfers) */
  phoneNumber?: string;
  /** Reference */
  reference: string;
  /** Description */
  description: string;
}

/** PesaLink transfer response */
export interface PesaLinkTransferResponse {
  /** Unique reference */
  reference: string;
  /** Status */
  status: string;
  /** Timestamp */
  timestamp: string;
  /** Fee charged */
  fee: number;
}

/** PesaLink IPN callback */
export interface PesaLinkIpnCallback {
  /** Transaction reference */
  transactionReference: string;
  /** Source account */
  sourceAccountNumber: string;
  /** Source bank */
  sourceBankCode: string;
  /** Amount */
  amount: number;
  /** Destination account */
  destinationAccountNumber: string;
  /** Status */
  status: string;
  /** Timestamp */
  timestamp: string;
}

// ── Co-op Connect Models ──────────────────────────────────────

/** Co-op Connect payment request */
export interface CoopPaymentRequest {
  amount: number;
  accountReference: string;
  phoneNumber: string;
  description: string;
}

/** Co-op Connect transfer request (for payouts) */
export interface CoopTransferRequest {
  amount: number;
  destinationAccount: string;
  destinationBankCode: string;
  reference: string;
  description: string;
}

/** Co-op Connect callback */
export interface CoopCallback {
  transactionRef: string;
  amount: number;
  accountNumber: string;
  phoneNumber: string;
  timestamp: string;
  status: string;
}

// ── Chama Payment Record ──────────────────────────────────────
// Internal record of a payment within the Chama system.
export interface ChamaPaymentRecord {
  id: number;
  /** Payment type: contribution, payout, fine, social fund */
  paymentType: 'CONTRIBUTION' | 'PAYOUT' | 'FINE' | 'SOCIAL_FUND' | 'OVERPAYMENT';
  /** Chama member who made/received this payment */
  memberId: number;
  /** Contribution period (for contribution payments) */
  periodId?: number;
  /** Payout record (for payouts) */
  payoutId?: number;
  /** Amount in KES */
  amount: number;
  /** Payment method chosen */
  paymentMethod: PaymentMethod;
  /** Provider that processed this payment */
  provider: PaymentProvider;
  /** Provider's transaction reference */
  providerTransactionId: string;
  /** M-Pesa receipt number (if M-Pesa) */
  mpesaReceiptNumber?: string;
  /** Current gateway status */
  status: GatewayTransactionStatus;
  /** When initiated */
  initiatedAt: string;
  /** When confirmed by provider */
  confirmedAt?: string;
  /** Provider callback timestamp */
  callbackReceivedAt?: string;
  /** Whether this payment has been reconciled */
  isReconciled: boolean;
  /** Reconciliation status */
  reconciliationStatus?: PaymentReconciliationStatus;
  /** Overpayment amount (if payment exceeded amount due) */
  overpaymentAmount: number;
  /** Fee charged by provider */
  providerFee: number;
  /** Net amount received */
  netAmount: number;
  /** Account reference sent to provider */
  accountReference: string;
  /** Callback/webhook data (raw) */
  callbackData?: Record<string, unknown>;
  /** Error message (if failed) */
  errorMessage?: string;
  /** Retry count */
  retryCount: number;
  /** Max retries allowed */
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

// ── Payment Reconciliation Summary ────────────────────────────
export interface PaymentReconciliationSummary {
  /** Date being reconciled */
  reconciliationDate: string;
  /** Provider being reconciled */
  provider: PaymentProvider;
  /** Total transactions in Chama records */
  internalTransactionCount: number;
  /** Total transactions in provider statement */
  providerTransactionCount: number;
  /** Transactions that matched */
  matchedCount: number;
  /** Transactions only in Chama (missing from provider) */
  internalOnlyCount: number;
  /** Transactions only in provider (missing from Chama) */
  providerOnlyCount: number;
  /** Amount mismatches */
  amountMismatchCount: number;
  /** Duplicates detected */
  duplicateCount: number;
  /** Total internal amount */
  internalTotalAmount: number;
  /** Total provider amount */
  providerTotalAmount: number;
  /** Total discrepancy amount */
  discrepancyAmount: number;
  /** All records for detail view */
  records: PaymentReconciliationRecord[];
}
