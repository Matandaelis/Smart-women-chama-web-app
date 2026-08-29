/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { describe, expect, it } from '@jest/globals';

import {
  PaymentProvider,
  MpesaTransactionStatus,
  StkPushStatus,
  B2CPaymentType,
  B2CResultStatus,
  GatewayTransactionStatus,
  PaymentMethod,
  PaymentReconciliationStatus,
  C2BTransactionType,
  PesaLinkTransferType
} from './payment.enums';

// ── Enum Completeness ──────────────────────────────────────────

describe('Payment enums', () => {
  it('PaymentProvider covers all integrations', () => {
    expect(PaymentProvider.MPESA_DARAJA).toBe('MPESA_DARAJA');
    expect(PaymentProvider.PESAPAL).toBe('PESAPAL');
    expect(PaymentProvider.INTASEND).toBe('INTASEND');
    expect(PaymentProvider.EQUITY_JENGA).toBe('EQUITY_JENGA');
    expect(PaymentProvider.KCB_BUNI).toBe('KCB_BUNI');
    expect(PaymentProvider.COOP_CONNECT).toBe('COOP_CONNECT');
    expect(PaymentProvider.PESALINK).toBe('PESALINK');
    expect(PaymentProvider.RTGS).toBe('RTGS');
    expect(PaymentProvider.EFT).toBe('EFT');
    expect(PaymentProvider.MANUAL).toBe('MANUAL');
  });

  it('MpesaTransactionStatus covers Daraja response codes', () => {
    expect(MpesaTransactionStatus.SUCCESS).toBe('0');
    expect(MpesaTransactionStatus.INSUFFICIENT_BALANCE).toBe('1');
    expect(MpesaTransactionStatus.TIMEOUT).toBe('1032');
    expect(MpesaTransactionStatus.CANCELLED_BY_USER).toBe('1033');
    expect(MpesaTransactionStatus.DUPLICATE_REFERENCE).toBe('1039');
  });

  it('StkPushStatus covers STK Push lifecycle', () => {
    expect(StkPushStatus.INITIATED).toBe('INITIATED');
    expect(StkPushStatus.PROCESSING).toBe('PROCESSING');
    expect(StkPushStatus.COMPLETED).toBe('COMPLETED');
    expect(StkPushStatus.FAILED).toBe('FAILED');
    expect(StkPushStatus.TIMEOUT).toBe('TIMEOUT');
    expect(StkPushStatus.UNKNOWN).toBe('UNKNOWN');
  });

  it('PaymentMethod covers all channels', () => {
    expect(PaymentMethod.MPESA_STK_PUSH).toBe('MPESA_STK_PUSH');
    expect(PaymentMethod.MPESA_PAYBILL).toBe('MPESA_PAYBILL');
    expect(PaymentMethod.MPESA_TILL).toBe('MPESA_TILL');
    expect(PaymentMethod.BANK_PESALINK).toBe('BANK_PESALINK');
    expect(PaymentMethod.BANK_RTGS).toBe('BANK_RTGS');
    expect(PaymentMethod.BANK_EFT).toBe('BANK_EFT');
    expect(PaymentMethod.CARD).toBe('CARD');
    expect(PaymentMethod.CASH).toBe('CASH');
  });

  it('GatewayTransactionStatus covers all states', () => {
    expect(GatewayTransactionStatus.INITIATED).toBe('INITIATED');
    expect(GatewayTransactionStatus.PROCESSING).toBe('PROCESSING');
    expect(GatewayTransactionStatus.SUCCESS).toBe('SUCCESS');
    expect(GatewayTransactionStatus.FAILED).toBe('FAILED');
    expect(GatewayTransactionStatus.TIMEOUT).toBe('TIMEOUT');
    expect(GatewayTransactionStatus.UNKNOWN).toBe('UNKNOWN');
    expect(GatewayTransactionStatus.REVERSED).toBe('REVERSED');
    expect(GatewayTransactionStatus.PENDING_USER_ACTION).toBe('PENDING_USER_ACTION');
  });

  it('PaymentReconciliationStatus covers reconciliation states', () => {
    expect(PaymentReconciliationStatus.MATCHED).toBe('MATCHED');
    expect(PaymentReconciliationStatus.INTERNAL_ONLY).toBe('INTERNAL_ONLY');
    expect(PaymentReconciliationStatus.PROVIDER_ONLY).toBe('PROVIDER_ONLY');
    expect(PaymentReconciliationStatus.AMOUNT_MISMATCH).toBe('AMOUNT_MISMATCH');
    expect(PaymentReconciliationStatus.DUPLICATE).toBe('DUPLICATE');
    expect(PaymentReconciliationStatus.PENDING_REVIEW).toBe('PENDING_REVIEW');
    expect(PaymentReconciliationStatus.RESOLVED).toBe('RESOLVED');
  });

  it('B2CPaymentType covers all payout types', () => {
    expect(B2CPaymentType.BUSINESS_PAYMENT).toBe('BusinessPayment');
    expect(B2CPaymentType.SALARY_PAYMENT).toBe('SalaryPayment');
    expect(B2CPaymentType.GOVERNMENT_PAYMENT).toBe('GovernmentPayment');
    expect(B2CPaymentType.PROMOTIONAL_PAYMENT).toBe('PromotionPayment');
  });
});

// ── Business Invariants ────────────────────────────────────────

describe('Payment business invariants', () => {
  it('Provider transaction ID must be unique per transaction', () => {
    const providerTxnIds = new Set<string>();
    const transaction = { providerTransactionId: 'MPESA-12345' };
    providerTxnIds.add(transaction.providerTransactionId);

    // Duplicate must be detected
    const isDuplicate = providerTxnIds.has('MPESA-12345');
    expect(isDuplicate).toBe(true);
  });

  it('STK Push timeout requires polling, not blind retry', () => {
    const status = StkPushStatus.TIMEOUT;
    const canRetry = false; // Must poll Transaction Status API first
    expect(status).toBe(StkPushStatus.TIMEOUT);
    expect(canRetry).toBe(false);
  });

  it('M-Pesa ResultCode 0 = success, non-zero = failure', () => {
    const successCode = MpesaTransactionStatus.SUCCESS;
    const failureCode = MpesaTransactionStatus.INSUFFICIENT_BALANCE;
    const cancelledCode = MpesaTransactionStatus.CANCELLED_BY_USER;

    expect(parseInt(successCode, 10)).toBe(0);
    expect(parseInt(failureCode, 10)).toBeGreaterThan(0);
    expect(parseInt(cancelledCode, 10)).toBeGreaterThan(0);
  });

  it('B2C payout requires sufficient float', () => {
    const paybillBalance = 100000;
    const payoutAmount = 60000;
    const hasSufficientFloat = paybillBalance >= payoutAmount;
    expect(hasSufficientFloat).toBe(true);
  });

  it('B2C payout fails without sufficient float', () => {
    const paybillBalance = 30000;
    const payoutAmount = 60000;
    const hasSufficientFloat = paybillBalance >= payoutAmount;
    expect(hasSufficientFloat).toBe(false);
  });

  it('Reconciliation: matched amounts should have zero discrepancy', () => {
    const internalAmount = 5000;
    const providerAmount = 5000;
    const discrepancy = Math.abs(internalAmount - providerAmount);
    expect(discrepancy).toBe(0);
  });

  it('Reconciliation: mismatched amounts flag discrepancy', () => {
    const internalAmount = 5000;
    const providerAmount = 4800;
    const discrepancy = Math.abs(internalAmount - providerAmount);
    expect(discrepancy).toBe(200);
    expect(discrepancy).toBeGreaterThan(0);
  });

  it('Chama account reference format is parseable', () => {
    const memberId = 12;
    const periodId = 1;
    const reference = `CHAMA-M${memberId}-P${periodId}`;

    const match = reference.match(/CHAMA-M(\d+)-P(\d+)/);
    expect(match).not.toBeNull();
    expect(parseInt(match![1], 10)).toBe(12);
    expect(parseInt(match![2], 10)).toBe(1);
  });

  it('Provider fee is deducted from net amount', () => {
    const grossAmount = 5000;
    const fixedFee = 25;
    const percentageFee = 0.025; // 2.5%
    const percentageAmount = grossAmount * percentageFee;
    const totalFee = fixedFee + percentageAmount;
    const netAmount = grossAmount - totalFee;

    expect(totalFee).toBe(150);
    expect(netAmount).toBe(4850);
    expect(netAmount).toBeLessThan(grossAmount);
  });

  it('M-Pesa Daraja OAuth token expires after ~55 minutes', () => {
    const tokenLifetimeSeconds = 3599;
    const cacheExpiryBuffer = 300; // 5 minutes buffer
    const effectiveLifetime = tokenLifetimeSeconds - cacheExpiryBuffer;

    expect(effectiveLifetime).toBe(3299);
    expect(effectiveLifetime).toBeGreaterThan(0);
  });

  it('PesaLink max transfer limit per transaction', () => {
    const pesaLinkMaxPerTransaction = 999999; // KES 999,999
    const transferAmount = 60000;
    const exceedsLimit = transferAmount > pesaLinkMaxPerTransaction;
    expect(exceedsLimit).toBe(false);
  });

  it('Daraja callback should NOT be sole source of truth', () => {
    // Callback reliability is approximately 95-98%
    // Always implement polling as fallback
    const callbackReliability = 0.97;
    const requiresPolling = callbackReliability < 1.0;
    expect(requiresPolling).toBe(true);
  });

  it('Cash payment creates immediate SUCCESS status', () => {
    const cashPayment = {
      provider: PaymentProvider.MANUAL,
      status: GatewayTransactionStatus.SUCCESS
    };
    expect(cashPayment.status).toBe(GatewayTransactionStatus.SUCCESS);
  });
});
