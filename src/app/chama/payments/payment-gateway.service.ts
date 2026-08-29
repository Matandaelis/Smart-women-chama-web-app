/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentStatusResponse,
  PaymentReconciliationRecord,
  PaymentReconciliationSummary,
  ChamaPaymentRecord,
  PaymentProvider,
  PaymentMethod,
  GatewayTransactionStatus,
  PaymentReconciliationStatus,
  B2CPaymentType
} from './models';

import { MpesaDarajaService } from './providers/mpesa-daraja.service';
import { PesapalService } from './providers/pesapal.service';
import { IntaSendService } from './providers/intasend.service';
import { JengaPesaLinkService } from './providers/bank-services.service';

/**
 * Unified Payment Gateway Service
 *
 * This is the single entry point for all payment operations in the Chama.
 * It routes to the correct provider based on payment method and configuration.
 *
 * PROVIDER ROUTING:
 * ┌─────────────────────┬──────────────────────────────┐
 * │ Payment Method      │ Primary Provider             │
 * ├─────────────────────┼──────────────────────────────┤
 * │ MPESA_STK_PUSH      │ Daraja (direct) or IntaSend  │
 * │ MPESA_PAYBILL       │ Daraja C2B                   │
 * │ MPESA_TILL          │ Daraja C2B                   │
 * │ MPESA_SEND_MONEY    │ IntaSend or Daraja           │
 * │ BANK_PESALINK       │ Jenga (Equity) or KCB Buni   │
 * │ BANK_RTGS           │ Jenga or Co-op               │
 * │ BANK_EFT            │ Any bank API                 │
 * │ CARD                │ Pesapal or IntaSend          │
 * │ CASH                │ Manual recording             │
 * └─────────────────────┴──────────────────────────────┘
 *
 * RECONCILIATION FLOW:
 * 1. Daily: Fetch statements from all providers
 * 2. Match provider transactions to internal records (by providerTransactionId)
 * 3. Flag mismatches (INTERNAL_ONLY, PROVIDER_ONLY, AMOUNT_MISMATCH)
 * 4. Present reconciliation dashboard for manual review
 * 5. Resolve discrepancies with audit trail
 *
 * FINERACT INTEGRATION:
 * - Provider transaction IDs map to Fineract savings transactions
 * - Internal payment records map to Fineract contribution requirements
 * - Payout records map to Fineract account transfers
 */
@Injectable({ providedIn: 'root' })
export class PaymentGatewayService {
  private http = inject(HttpClient);
  private mpesa = inject(MpesaDarajaService);
  private pesapal = inject(PesapalService);
  private intasend = inject(IntaSendService);
  private jenga = inject(JengaPesaLinkService);

  // ── Payment Initiation ──────────────────────────────────────

  /**
   * Initiate a payment (contribution collection or other).
   * Routes to the correct provider based on payment method.
   *
   * @param request - Payment details with method, amount, member info
   * @returns Observable with provider response and tracking IDs
   */
  initiatePayment(request: PaymentInitiationRequest): Observable<PaymentInitiationResponse> {
    switch (request.paymentMethod) {
      case PaymentMethod.MPESA_STK_PUSH:
        return this.initiateMpesaStkPush(request);
      case PaymentMethod.MPESA_PAYBILL:
      case PaymentMethod.MPESA_TILL:
        // Paybill/Till payments are passive — member sends money.
        // We just return the paybill/till details for the member to use.
        return this.getPaybillDetails(request);
      case PaymentMethod.BANK_PESALINK:
        return this.initiatePesaLinkTransfer(request);
      case PaymentMethod.CARD:
        return this.initiateCardPayment(request);
      case PaymentMethod.BANK_RTGS:
      case PaymentMethod.BANK_EFT:
        return this.initiateBankTransfer(request);
      case PaymentMethod.CASH:
        return this.recordCashPayment(request);
      default:
        throw new Error(`Unsupported payment method: ${request.paymentMethod}`);
    }
  }

  /**
   * Initiate M-Pesa STK Push via Daraja (or IntaSend as fallback).
   *
   * fineract-api: POST /mpesa/stkpush/v1/processrequest
   */
  private initiateMpesaStkPush(request: PaymentInitiationRequest): Observable<PaymentInitiationResponse> {
    const accountRef = request.accountReference;

    // Try Daraja first (direct integration)
    return this.mpesa
      .initiateStkPush({
        phoneNumber: request.phoneNumber!,
        amount: request.amount,
        accountReference: accountRef,
        transactionDescription: request.description
      })
      .pipe(
        map((response) => ({
          chamaTransactionId: this.generateChamaTransactionId(),
          providerTransactionId: response.checkoutRequestId || response.merchantRequestId,
          providerCheckoutId: response.checkoutRequestId,
          status: GatewayTransactionStatus.PENDING_USER_ACTION,
          provider: PaymentProvider.MPESA_DARAJA,
          amount: request.amount,
          message: response.customerMessage
        }))
      );
  }

  /**
   * Get Paybill details for member-initiated payment.
   */
  private getPaybillDetails(request: PaymentInitiationRequest): Observable<PaymentInitiationResponse> {
    const paybillNumber = (window as any).env?.mpesaPaybillShortCode || '';
    return of({
      chamaTransactionId: this.generateChamaTransactionId(),
      providerTransactionId: '',
      status: GatewayTransactionStatus.INITIATED,
      provider: PaymentProvider.MPESA_DARAJA,
      amount: request.amount,
      message: `Send KES ${request.amount} to Paybill ${paybillNumber}, Account: ${request.accountReference}`
    });
  }

  /**
   * Initiate PesaLink bank transfer via Jenga API.
   */
  private initiatePesaLinkTransfer(request: PaymentInitiationRequest): Observable<PaymentInitiationResponse> {
    return this.jenga
      .initiatePesaLinkTransfer({
        amount: request.amount,
        destinationBankCode: request.bankCode!,
        destinationAccountNumber: request.bankAccountNumber!,
        reference: request.accountReference,
        description: request.description,
        transferType: 'BANK_TRANSFER' as any
      })
      .pipe(
        map((response) => ({
          chamaTransactionId: this.generateChamaTransactionId(),
          providerTransactionId: response.reference,
          status: GatewayTransactionStatus.PROCESSING,
          provider: PaymentProvider.PESALINK,
          amount: request.amount,
          message: `PesaLink transfer initiated: ${response.reference}`
        }))
      );
  }

  /**
   * Initiate card payment via Pesapal.
   */
  private initiateCardPayment(request: PaymentInitiationRequest): Observable<PaymentInitiationResponse> {
    return this.pesapal
      .createOrder({
        amount: request.amount,
        description: request.description,
        type: 'MERCHANT',
        reference: request.accountReference,
        firstName: '',
        lastName: '',
        email: request.metadata?.['email'] || '',
        callbackUrl: request.callbackUrl || `${window.location.origin}/#/chama/contributions/callback`
      })
      .pipe(
        map((response) => ({
          chamaTransactionId: this.generateChamaTransactionId(),
          providerTransactionId: response.orderTrackingId,
          status: GatewayTransactionStatus.PROCESSING,
          provider: PaymentProvider.PESAPAL,
          amount: request.amount,
          redirectUrl: response.redirectUrl,
          message: 'Redirect to payment page'
        }))
      );
  }

  /**
   * Initiate bank transfer (RTGS/EFT) via Jenga.
   */
  private initiateBankTransfer(request: PaymentInitiationRequest): Observable<PaymentInitiationResponse> {
    return this.initiatePesaLinkTransfer(request);
  }

  /**
   * Record a cash payment (manual entry).
   */
  private recordCashPayment(request: PaymentInitiationRequest): Observable<PaymentInitiationResponse> {
    return of({
      chamaTransactionId: this.generateChamaTransactionId(),
      providerTransactionId: `CASH-${Date.now()}`,
      status: GatewayTransactionStatus.SUCCESS,
      provider: PaymentProvider.MANUAL,
      amount: request.amount,
      message: 'Cash payment recorded'
    });
  }

  // ── Payout (Disbursement) ───────────────────────────────────

  /**
   * Send a payout to a member.
   * Routes to M-Pesa B2C (Daraja) or bank transfer (Jenga) based on preference.
   *
   * fineract-api: POST /mpesa/b2c/v1/paymentrequest (for M-Pesa)
   * fineract-api: POST /api/v1/transfer/bank/transfer (for bank)
   *
   * @param memberId - Recipient member ID
   * @param amount - Payout amount in KES
   * @param paymentMethod - M-Pesa or bank transfer
   * @param phoneNumber - M-Pesa number (if M-Pesa)
   * @param bankAccount - Bank account (if bank transfer)
   * @param bankCode - Bank code (if bank transfer)
   * @param periodId - Period this payout is for
   * @returns Observable with payout transaction ID
   */
  sendPayout(
    memberId: number,
    amount: number,
    paymentMethod: PaymentMethod,
    phoneNumber?: string,
    bankAccount?: string,
    bankCode?: string,
    periodId?: number
  ): Observable<PaymentInitiationResponse> {
    if (paymentMethod === PaymentMethod.MPESA_STK_PUSH || paymentMethod === PaymentMethod.MPESA_SEND_MONEY) {
      return this.mpesa
        .initiateB2cPayment({
          phoneNumber: phoneNumber!,
          amount,
          paymentType: B2CPaymentType.BUSINESS_PAYMENT,
          occasion: `Payout-P${periodId}-M${memberId}`,
          remarks: `Chama rotation payout - Period ${periodId}`
        })
        .pipe(
          map((response) => ({
            chamaTransactionId: this.generateChamaTransactionId(),
            providerTransactionId: response.conversationId,
            status: GatewayTransactionStatus.PROCESSING,
            provider: PaymentProvider.MPESA_DARAJA,
            amount,
            message: response.responseDescription
          }))
        );
    }

    // Bank transfer via PesaLink
    return this.jenga
      .initiatePesaLinkTransfer({
        amount,
        destinationBankCode: bankCode!,
        destinationAccountNumber: bankAccount!,
        reference: `CHAMA-PO-P${periodId}-M${memberId}`,
        description: `Chama rotation payout - Period ${periodId}`,
        transferType: 'BANK_TRANSFER' as any
      })
      .pipe(
        map((response) => ({
          chamaTransactionId: this.generateChamaTransactionId(),
          providerTransactionId: response.reference,
          status: GatewayTransactionStatus.PROCESSING,
          provider: PaymentProvider.PESALINK,
          amount,
          message: `PesaLink payout initiated: ${response.reference}`
        }))
      );
  }

  // ── Status Query ─────────────────────────────────────────────

  /**
   * Query payment status across any provider.
   * Used when callback is not received or for reconciliation checks.
   *
   * @param chamaTransactionId - Internal transaction ID
   * @param provider - Which provider to query
   * @param providerTransactionId - Provider's transaction reference
   * @returns Observable with unified status response
   */
  queryPaymentStatus(
    chamaTransactionId: string,
    provider: PaymentProvider,
    providerTransactionId: string
  ): Observable<PaymentStatusResponse> {
    const statusQuery = this.createStatusQuery(provider, providerTransactionId);

    return statusQuery.pipe(
      map((result) => ({
        chamaTransactionId,
        providerTransactionId,
        provider,
        status: result.status,
        mpesaReceiptNumber: result.mpesaReceiptNumber,
        amount: result.amount,
        statusUpdatedAt: new Date().toISOString(),
        rawResponse: result.rawResponse
      }))
    );
  }

  private createStatusQuery(
    provider: PaymentProvider,
    transactionId: string
  ): Observable<{
    status: GatewayTransactionStatus;
    mpesaReceiptNumber?: string;
    amount: number;
    rawResponse?: Record<string, unknown>;
  }> {
    switch (provider) {
      case PaymentProvider.MPESA_DARAJA:
        return this.mpesa.queryTransactionStatus(transactionId).pipe(
          map((response) => ({
            status:
              response.ResultCode === '0'
                ? GatewayTransactionStatus.SUCCESS
                : response.ResultCode === '1032'
                  ? GatewayTransactionStatus.TIMEOUT
                  : GatewayTransactionStatus.FAILED,
            mpesaReceiptNumber: response.TransactionID,
            amount: 0, // Amount not returned in status query
            rawResponse: response as unknown as Record<string, unknown>
          }))
        );

      default:
        return of({
          status: GatewayTransactionStatus.UNKNOWN,
          amount: 0
        });
    }
  }

  // ── Callback Processing ─────────────────────────────────────

  /**
   * Process incoming callback from any provider.
   * Routes to the correct handler based on provider identifier.
   *
   * @param provider - Which provider sent the callback
   * @param callbackData - Raw callback payload
   * @returns Processed payment record
   */
  processCallback(
    provider: PaymentProvider,
    callbackData: Record<string, unknown>
  ): Observable<{
    isValid: boolean;
    providerTransactionId: string;
    amount: number;
    status: GatewayTransactionStatus;
    mpesaReceiptNumber?: string;
    matchedMemberId?: number;
    matchedPeriodId?: number;
  }> {
    switch (provider) {
      case PaymentProvider.MPESA_DARAJA:
        // Determine if STK Push callback or C2B callback
        if ('checkoutRequestId' in callbackData) {
          // STK Push callback
          const result = {
            isValid: callbackData['resultCode'] === '0',
            providerTransactionId: callbackData['checkoutRequestId'] as string,
            amount: callbackData['amount'] as number,
            status:
              callbackData['resultCode'] === '0' ? GatewayTransactionStatus.SUCCESS : GatewayTransactionStatus.FAILED,
            mpesaReceiptNumber: callbackData['mpesaReceiptNumber'] as string
          };
          return of(result);
        } else {
          // C2B callback
          const parsed = this.mpesa.processC2bCallback(callbackData as any);
          return of({
            isValid: parsed.isValid,
            providerTransactionId: parsed.mpesaReceiptNumber,
            amount: parsed.amount,
            status: parsed.isValid ? GatewayTransactionStatus.SUCCESS : GatewayTransactionStatus.FAILED,
            mpesaReceiptNumber: parsed.mpesaReceiptNumber,
            matchedMemberId: parsed.matchedMemberId,
            matchedPeriodId: parsed.matchedPeriodId
          });
        }

      case PaymentProvider.PESAPAL:
        const pesapalResult = this.pesapal.processIpnCallback(callbackData as any);
        return of({
          isValid: pesapalResult.isSuccessful,
          providerTransactionId: pesapalResult.providerTransactionId,
          amount: pesapalResult.amount,
          status: pesapalResult.status
        });

      case PaymentProvider.INTASEND:
        const intaSendResult = this.intasend.processWebhook(callbackData as any);
        return of({
          isValid: intaSendResult.isSuccessful,
          providerTransactionId: intaSendResult.providerTransactionId,
          amount: intaSendResult.amount,
          status: intaSendResult.status,
          mpesaReceiptNumber: intaSendResult.mpesaReceipt
        });

      case PaymentProvider.KCB_BUNI:
        const kcbResult = this.jenga.processIpnCallback(callbackData as any);
        return of({
          isValid: kcbResult.isSuccessful,
          providerTransactionId: kcbResult.reference,
          amount: kcbResult.amount,
          status: kcbResult.status
        });

      case PaymentProvider.EQUITY_JENGA:
      case PaymentProvider.PESALINK:
        const jengaResult = this.jenga.processIpnCallback(callbackData as any);
        return of({
          isValid: jengaResult.isSuccessful,
          providerTransactionId: jengaResult.reference,
          amount: jengaResult.amount,
          status: jengaResult.status
        });

      default:
        return of({
          isValid: false,
          providerTransactionId: '',
          amount: 0,
          status: GatewayTransactionStatus.UNKNOWN
        });
    }
  }

  // ── Reconciliation ──────────────────────────────────────────

  /**
   * Fetch reconciliation records for a date range.
   * Compares internal records against provider statements.
   *
   * fineract-api: GET /runreports/PaymentReconciliation
   *
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param provider - Filter by provider (optional)
   * @returns Observable with reconciliation summary
   */
  getReconciliationSummary(
    startDate: string,
    endDate: string,
    provider?: PaymentProvider
  ): Observable<PaymentReconciliationSummary> {
    let params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    if (provider) {
      params = params.set('provider', provider);
    }

    return this.http.get<PaymentReconciliationSummary>('/runreports/PaymentReconciliation', { params });
  }

  /**
   * Resolve a reconciliation discrepancy.
   *
   * fineract-api: PUT /datatables/dt_payment_reconciliation/{recordId}
   *
   * @param recordId - Reconciliation record ID
   * @param resolution - Resolution details
   * @returns Observable with updated record
   */
  resolveReconciliation(
    recordId: number,
    resolution: {
      status: PaymentReconciliationStatus;
      notes: string;
      adjustedAmount?: number;
    }
  ): Observable<PaymentReconciliationRecord> {
    return this.http.put<PaymentReconciliationRecord>(`/datatables/dt_payment_reconciliation/${recordId}`, resolution);
  }

  // ── Provider Configuration ──────────────────────────────────

  /**
   * Get active payment providers and their supported methods.
   */
  getActiveProviders(): Observable<
    {
      provider: PaymentProvider;
      canCollect: boolean;
      canDisburse: boolean;
      supportedMethods: PaymentMethod[];
    }[]
  > {
    // In production, this would come from a configuration API
    return of([
      {
        provider: PaymentProvider.MPESA_DARAJA,
        canCollect: true,
        canDisburse: true,
        supportedMethods: [
          PaymentMethod.MPESA_STK_PUSH,
          PaymentMethod.MPESA_PAYBILL,
          PaymentMethod.MPESA_TILL
        ]
      },
      {
        provider: PaymentProvider.PESAPAL,
        canCollect: true,
        canDisburse: false,
        supportedMethods: [
          PaymentMethod.MPESA_STK_PUSH,
          PaymentMethod.CARD
        ]
      },
      {
        provider: PaymentProvider.INTASEND,
        canCollect: true,
        canDisburse: true,
        supportedMethods: [
          PaymentMethod.MPESA_STK_PUSH,
          PaymentMethod.CARD
        ]
      },
      {
        provider: PaymentProvider.EQUITY_JENGA,
        canCollect: true,
        canDisburse: true,
        supportedMethods: [
          PaymentMethod.BANK_PESALINK,
          PaymentMethod.CARD
        ]
      },
      {
        provider: PaymentProvider.KCB_BUNI,
        canCollect: true,
        canDisburse: true,
        supportedMethods: [PaymentMethod.BANK_PESALINK]
      },
      {
        provider: PaymentProvider.COOP_CONNECT,
        canCollect: true,
        canDisburse: true,
        supportedMethods: [PaymentMethod.BANK_PESALINK]
      }
    ]);
  }

  // ── Helpers ─────────────────────────────────────────────────

  /** Generate unique Chama transaction ID */
  private generateChamaTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}
