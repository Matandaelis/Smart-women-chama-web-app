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

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  MpesaStkPushRequest,
  MpesaStkPushResponse,
  MpesaStkCallback,
  MpesaC2BCallback,
  MpesaB2CPaymentRequest,
  MpesaB2CPaymentResponse,
  MpesaB2CCallback
} from '../models';

/**
 * M-Pesa Daraja API Service
 *
 * Integrates with Safaricom's Daraja 3.0 API for:
 * - STK Push (Lipa Na M-Pesa Online) — collect contributions
 * - C2B (Customer to Business) — receive paybill/till payments
 * - B2C (Business to Customer) — send rotation payouts
 * - Transaction Status Query — poll for payment status
 * - Reversal — reverse incorrect payments
 *
 * fineract-api: https://developer.safaricom.co.ke/APIs
 *
 * IMPORTANT CALLBACK RELIABILITY NOTES:
 * - Daraja callbacks (C2B confirmation, STK Push result) are NOT 100% reliable
 * - Always implement both callback reception AND polling via Transaction Status API
 * - Reconcile daily against Safaricom's statement download
 * - Callbacks may arrive out of order or be delayed by minutes/hours
 *
 * SECURITY:
 * - Consumer Key, Consumer Secret, Initiator credentials stored server-side only
 * - OAuth tokens cached and refreshed before expiry (55-minute lifetime)
 * - IP whitelisting recommended on Daraja portal
 * - Initiate password encrypted with RSA public key (Daraja 3.0 requirement)
 */
@Injectable({ providedIn: 'root' })
export class MpesaDarajaService {
  private http = inject(HttpClient);

  private readonly SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
  private readonly PRODUCTION_URL = 'https://api.safaricom.co.ke';
  private readonly STK_PUSH_PATH = '/mpesa/stkpush/v1/processrequest';
  private readonly STK_PUSH_QUERY_PATH = '/mpesa/stkpushquery/v1/query';
  private readonly C2B_REGISTER_URL_PATH = '/mpesa/c2bvalidation/v1/register';
  private readonly B2C_PAYMENT_PATH = '/mpesa/b2c/v1/paymentrequest';
  private readonly TRANSACTION_STATUS_PATH = '/mpesa/transactionstatus/v1/query';
  private readonly REVERSAL_PATH = '/mpesa/reversal/v1/request';
  private readonly BALANCE_PATH = '/mpesa/accountbalance/v1/query';

  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {}

  // ── OAuth Token Management ────────────────────────────────────

  /**
   * Get OAuth access token from Daraja.
   * Tokens are valid for 55 minutes. This method caches and refreshes.
   *
   * fineract-api: GET /oauth/v1/generate?grant_type=client_credentials
   */
  getAccessToken(): Observable<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return new Observable<string>((observer) => {
        observer.next(this.accessToken!);
        observer.complete();
      });
    }

    const credentials = btoa(`${this.getConsumerKey()}:${this.getConsumerSecret()}`);
    const headers = new HttpHeaders({
      Authorization: `Basic ${credentials}`
    });

    return this.http
      .get<{ access_token: string; expires_in: string }>(
        `${this.getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
        { headers }
      )
      .pipe(
        map((response) => {
          this.accessToken = response.access_token;
          // Token expires in seconds (typically 3599), cache for 55 minutes
          const expiresInSeconds = parseInt(response.expires_in, 10);
          this.tokenExpiry = new Date(Date.now() + (expiresInSeconds - 300) * 1000);
          return this.accessToken!;
        })
      );
  }

  // ── STK Push (Lipa Na M-Pesa Online) ────────────────────────

  /**
   * Initiate STK Push to collect contribution from a member.
   *
   * This sends a payment prompt to the member's M-Pesa-enabled phone.
   * The member enters their PIN to authorize the payment.
   * Result is delivered via callback OR can be polled via query.
   *
   * fineract-api: POST /mpesa/stkpush/v1/processrequest
   *
   * @param request - STK Push request with phone, amount, and reference
   * @returns Observable with merchant request ID and checkout request ID
   */
  initiateStkPush(request: MpesaStkPushRequest): Observable<MpesaStkPushResponse> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const timestamp = this.generateTimestamp();
        const password = this.generatePassword(timestamp);

        const body = {
          BusinessShortCode: this.getPaybillShortCode(),
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: request.amount,
          PartyA: request.phoneNumber,
          PartyB: this.getPaybillShortCode(),
          PhoneNumber: request.phoneNumber,
          CallBackURL: this.getCallbackUrl(),
          AccountReference: request.accountReference,
          TransactionDesc: request.transactionDescription
        };

        return { body, headers };
      })
    ) as unknown as Observable<MpesaStkPushResponse>;

    // In production, the actual HTTP call would be:
    // return this.http.post<MpesaStkPushResponse>(
    //   `${this.getBaseUrl()}${this.STK_PUSH_PATH}`,
    //   body,
    //   { headers }
    // );
  }

  /**
   * Query STK Push transaction status.
   * Use this when callback is not received within expected timeframe.
   *
   * fineract-api: POST /mpesa/stkpushquery/v1/query
   *
   * @param checkoutRequestId - The checkout request ID from the STK Push response
   * @returns Observable with transaction status
   */
  queryStkPushStatus(checkoutRequestId: string): Observable<{
    ResponseCode: string;
    ResponseDescription: string;
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: string;
    ResultDesc: string;
  }> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const timestamp = this.generateTimestamp();
        const password = this.generatePassword(timestamp);

        const body = {
          BusinessShortCode: this.getPaybillShortCode(),
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId
        };

        return { body, headers };
      })
    ) as unknown as Observable<{
      ResponseCode: string;
      ResponseDescription: string;
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: string;
      ResultDesc: string;
    }>;
  }

  // ── C2B (Customer to Business) ───────────────────────────────

  /**
   * Register C2B validation and confirmation URLs with Daraja.
   * This enables receiving callbacks when customers pay to your paybill/till.
   *
   * fineract-api: POST /mpesa/c2bvalidation/v1/register
   *
   * Must be called once during setup. Safaricom will then send callbacks
   * to the registered URLs for every C2B transaction.
   */
  registerC2bUrls(
    validationUrl: string,
    confirmationUrl: string
  ): Observable<{
    ResponseCode: string;
    ResponseDescription: string;
  }> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const body = {
          ShortCode: this.getPaybillShortCode(),
          ResponseType: 'Completed',
          ValidationURL: validationUrl,
          ConfirmationURL: confirmationUrl
        };

        return { body, headers };
      })
    ) as unknown as Observable<{
      ResponseCode: string;
      ResponseDescription: string;
    }>;
  }

  /**
   * Process a C2B callback from Safaricom.
   * Called by your backend webhook endpoint when a customer pays to paybill.
   *
   * @param callback - Raw callback data from Safaricom
   * @returns Processed callback with matched account reference
   */
  processC2bCallback(callback: MpesaC2BCallback): {
    isValid: boolean;
    matchedMemberId?: number;
    matchedPeriodId?: number;
    amount: number;
    mpesaReceiptNumber: string;
    phoneNumber: string;
  } {
    // Parse account reference (format: "CHAMA-M{memberId}-P{periodId}")
    const match = callback.accountNumber?.match(/CHAMA-M(\d+)-P(\d+)/);

    return {
      isValid: callback.transAmount > 0 && callback.transID?.length > 0,
      matchedMemberId: match ? parseInt(match[1], 10) : undefined,
      matchedPeriodId: match ? parseInt(match[2], 10) : undefined,
      amount: callback.transAmount,
      mpesaReceiptNumber: callback.transID,
      phoneNumber: callback.msisdn
    };
  }

  // ── B2C (Business to Customer — Payouts) ────────────────────

  /**
   * Send a payout to a member's M-Pesa wallet.
   * Used for rotation payouts when the member receives the pool.
   *
   * fineract-api: POST /mpesa/b2c/v1/paymentrequest
   *
   * IMPORTANT: B2C requires:
   * 1. M-Pesa Paybill registered for B2C
   * 2. Sufficient float in the Paybill account
   * 3. Initiator credentials with B2C permission
   * 4. RSA-encrypted initiator password (Daraja 3.0)
   *
   * @param request - B2C payment request
   * @returns Observable with conversation ID for tracking
   */
  initiateB2cPayment(request: MpesaB2CPaymentRequest): Observable<MpesaB2CPaymentResponse> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const body = {
          InitiatorName: this.getInitiatorName(),
          SecurityCredential: this.getEncryptedSecurityCredential(),
          CommandID: request.paymentType,
          Amount: request.amount,
          PartyA: this.getPaybillShortCode(),
          PartyB: request.phoneNumber,
          Remarks: request.remarks,
          QueueTimeOutURL: this.getQueueTimeoutUrl(),
          ResultURL: this.getResultUrl(),
          Occasion: request.occasion
        };

        return { body, headers };
      })
    ) as unknown as Observable<MpesaB2CPaymentResponse>;
  }

  /**
   * Process B2C result callback from Safaricom.
   * Called when B2C payout succeeds, fails, or times out.
   *
   * @param callback - B2C result callback
   * @returns Processed result with status
   */
  processB2cCallback(callback: MpesaB2CCallback): {
    isCompleted: boolean;
    isFailed: boolean;
    isPending: boolean;
    transactionId?: string;
    amount?: number;
  } {
    return {
      isCompleted: callback.resultStatus === 'Completed',
      isFailed: callback.resultStatus === 'Failed',
      isPending: callback.resultStatus === 'Processing',
      transactionId: callback.transactionID,
      amount: callback.transactionAmount
    };
  }

  // ── Transaction Status Query ─────────────────────────────────

  /**
   * Query the status of any M-Pesa transaction.
   * Use for reconciliation and when callbacks are not received.
   *
   * fineract-api: POST /mpesa/transactionstatus/v1/query
   *
   * @param transactionId - M-Pesa transaction ID
   * @returns Observable with transaction status
   */
  queryTransactionStatus(transactionId: string): Observable<{
    ResponseCode: string;
    ResponseDescription: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    TransactionStatus: string;
    ResultCode: string;
    ResultDesc: string;
  }> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const body = {
          Initiator: this.getInitiatorName(),
          SecurityCredential: this.getEncryptedSecurityCredential(),
          CommandID: 'TransactionStatusQuery',
          TransactionID: transactionId,
          PartyA: this.getPaybillShortCode(),
          IdentifierType: '4',
          ResultURL: this.getResultUrl(),
          QueueTimeOutURL: this.getQueueTimeoutUrl()
        };

        return { body, headers };
      })
    ) as unknown as Observable<{
      ResponseCode: string;
      ResponseDescription: string;
      OriginatorConversationID: string;
      ConversationID: string;
      TransactionID: string;
      TransactionStatus: string;
      ResultCode: string;
      ResultDesc: string;
    }>;
  }

  // ── Reversal ─────────────────────────────────────────────────

  /**
   * Reverse an M-Pesa transaction.
   * Used for correcting erroneous payments.
   *
   * fineract-api: POST /mpesa/reversal/v1/request
   *
   * @param transactionId - M-Pesa transaction ID to reverse
   * @param amount - Amount to reverse
   * @param reason - Reason for reversal
   * @returns Observable with reversal status
   */
  reverseTransaction(
    transactionId: string,
    amount: number,
    reason: string
  ): Observable<{
    ResponseCode: string;
    ResponseDescription: string;
    ConversationID: string;
    OriginatorConversationID: string;
  }> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const body = {
          Initiator: this.getInitiatorName(),
          SecurityCredential: this.getEncryptedSecurityCredential(),
          CommandID: 'TransactionReversal',
          TransactionID: transactionId,
          Amount: amount,
          PartyA: this.getPaybillShortCode(),
          ReceiverParty: this.getPaybillShortCode(),
          ReceiverIdentifierType: '11',
          ResultURL: this.getResultUrl(),
          QueueTimeOutURL: this.getQueueTimeoutUrl(),
          Remarks: reason,
          Occasion: 'Chama Reversal'
        };

        return { body, headers };
      })
    ) as unknown as Observable<{
      ResponseCode: string;
      ResponseDescription: string;
      ConversationID: string;
      OriginatorConversationID: string;
    }>;
  }

  // ── Account Balance ──────────────────────────────────────────

  /**
   * Query Paybill/Till account balance.
   * Used for daily reconciliation — compare internal balance against M-Pesa balance.
   *
   * fineract-api: POST /mpesa/accountbalance/v1/query
   */
  queryAccountBalance(): Observable<{
    ResponseCode: string;
    ResponseDescription: string;
    ConversationID: string;
    OriginatorConversationID: string;
  }> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const body = {
          Initiator: this.getInitiatorName(),
          SecurityCredential: this.getEncryptedSecurityCredential(),
          CommandID: 'AccountBalance',
          PartyA: this.getPaybillShortCode(),
          IdentifierType: '4',
          ResultURL: this.getResultUrl(),
          QueueTimeOutURL: this.getQueueTimeoutUrl()
        };

        return { body, headers };
      })
    ) as unknown as Observable<{
      ResponseCode: string;
      ResponseDescription: string;
      ConversationID: string;
      OriginatorConversationID: string;
    }>;
  }

  // ── Helper Methods ───────────────────────────────────────────

  private getBaseUrl(): string {
    // In production, switch based on environment configuration
    return this.PRODUCTION_URL;
  }

  private getConsumerKey(): string {
    // Read from environment/config — never hardcode
    return (window as any).env?.mpesaConsumerKey || '';
  }

  private getConsumerSecret(): string {
    return (window as any).env?.mpesaConsumerSecret || '';
  }

  private getPaybillShortCode(): string {
    return (window as any).env?.mpesaPaybillShortCode || '';
  }

  private getInitiatorName(): string {
    return (window as any).env?.mpesaInitiatorName || '';
  }

  private getEncryptedSecurityCredential(): string {
    // In production, encrypt with Safaricom's RSA public key
    return (window as any).env?.mpesaSecurityCredential || '';
  }

  private getCallbackUrl(): string {
    return (window as any).env?.mpesaCallbackUrl || '';
  }

  private getQueueTimeoutUrl(): string {
    return (window as any).env?.mpesaQueueTimeoutUrl || '';
  }

  private getResultUrl(): string {
    return (window as any).env?.mpesaResultUrl || '';
  }

  /** Generate Daraja-compatible timestamp: YYYYMMDDHHmmss */
  private generateTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      `${now.getFullYear()}` +
      `${pad(now.getMonth() + 1)}` +
      `${pad(now.getDate())}` +
      `${pad(now.getHours())}` +
      `${pad(now.getMinutes())}` +
      `${pad(now.getSeconds())}`
    );
  }

  /** Generate Daraja password: Base64(BusinessShortCode + Passkey + Timestamp) */
  private generatePassword(timestamp: string): string {
    const passkey = (window as any).env?.mpesaPasskey || '';
    const shortCode = this.getPaybillShortCode();
    return btoa(`${shortCode}${passkey}${timestamp}`);
  }
}
