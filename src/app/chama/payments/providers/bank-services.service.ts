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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  PesaLinkTransferRequest,
  PesaLinkTransferResponse,
  PesaLinkIpnCallback,
  KcbIpnCallback,
  CoopCallback,
  GatewayTransactionStatus
} from '../models';

/**
 * Equity Bank Jenga API Service — PesaLink Integration
 *
 * Jenga API is Equity Bank's comprehensive API gateway providing:
 * - Payment Gateway (cards + M-Pesa + bank accounts)
 * - Send Money (bulk B2C to any Kenyan bank/mobile)
 * - PesaLink (instant inter-bank transfers)
 * - Account queries and KYC verification
 * - Currency exchange
 *
 * For Chama, Jenga provides:
 * - PesaLink transfers for bank-to-bank payouts
 * - Account balance queries for reconciliation
 * - B2C payments to any bank account
 *
 * API Docs: https://developer.jengahq.io/
 * Sandbox: https://sandbox.jengahq.io/
 * Production: https://api.jengahq.io
 *
 * Bank Code Reference (for PesaLink):
 * 01 = KCB, 07 = Co-operative, 12 = Equity, 16 = Absa,
 * 19 = I&M, 23 = Family, 25 = DTB, 35 = NCBA, 43 = SBM
 */
@Injectable({ providedIn: 'root' })
export class JengaPesaLinkService {
  private http = inject(HttpClient);

  private readonly SANDBOX_URL = 'https://sandbox.jengahq.io';
  private readonly PRODUCTION_URL = 'https://api.jengahq.io';

  private apiKey = '';
  private apiSecret = '';
  private username = '';

  constructor() {
    this.apiKey = (window as any).env?.jengaApiKey || '';
    this.apiSecret = (window as any).env?.jengaApiSecret || '';
    this.username = (window as any).env?.jengaUsername || '';
  }

  private getBaseUrl(): string {
    return this.PRODUCTION_URL;
  }

  /**
   * Get Jenga API access token.
   * Uses OAuth 2.0 client credentials grant.
   *
   * fineract-api: POST /oauth2/token
   */
  getAccessToken(): Observable<string> {
    const credentials = btoa(`${this.username}:${this.apiSecret}`);
    const headers = new HttpHeaders({
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = 'grant_type=client_credentials';

    return this.http
      .post<{ access_token: string; expires_in: number }>(`${this.getBaseUrl()}/oauth2/token`, body, { headers })
      .pipe(map((response) => response.access_token));
  }

  /**
   * Initiate PesaLink transfer (bank-to-bank).
   * Supports transfers between all major Kenyan banks.
   *
   * fineract-api: POST /api/v1/transfer/bank/transfer
   *
   * @param request - Transfer details with destination bank and account
   * @returns Observable with transfer reference
   */
  initiatePesaLinkTransfer(request: PesaLinkTransferRequest): Observable<PesaLinkTransferResponse> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const body = {
          source: {
            countryCode: 'KE',
            name: 'Smart Women Chama',
            accountNumber: this.getSourceAccountNumber()
          },
          destination: {
            countryCode: 'KE',
            name: request.destinationAccountName || '',
            type: request.transferType,
            accountNumber: request.destinationAccountNumber,
            bankCode: request.destinationBankCode,
            phoneNumber: request.phoneNumber
          },
          transfer: {
            amount: request.amount.toString(),
            currencyCode: 'KES',
            reference: request.reference,
            description: request.description
          }
        };

        return { headers, body };
      })
    ) as unknown as Observable<PesaLinkTransferResponse>;
  }

  /**
   * Query PesaLink transfer status.
   *
   * fineract-api: GET /api/v1/transfer/bank/transfer/{reference}
   */
  getTransferStatus(reference: string): Observable<{
    status: string;
    reference: string;
    amount: number;
    timestamp: string;
  }> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });
        return { headers, reference };
      })
    ) as unknown as Observable<{
      status: string;
      reference: string;
      amount: number;
      timestamp: string;
    }>;
  }

  /**
   * Get account balance for reconciliation.
   *
   * fineract-api: GET /api/v1/account/balance/{accountNumber}
   */
  getAccountBalance(accountNumber: string): Observable<{
    accountNumber: string;
    availableBalance: number;
    currency: string;
  }> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });
        return { headers, accountNumber };
      })
    ) as unknown as Observable<{
      accountNumber: string;
      availableBalance: number;
      currency: string;
    }>;
  }

  /**
   * Process PesaLink IPN callback.
   * Banks send IPN when PesaLink transfers complete.
   *
   * @param callback - IPN callback data
   * @returns Processed callback
   */
  processIpnCallback(callback: PesaLinkIpnCallback): {
    isSuccessful: boolean;
    reference: string;
    amount: number;
    sourceAccount: string;
    destinationAccount: string;
    status: GatewayTransactionStatus;
  } {
    return {
      isSuccessful: callback.status === 'SUCCESS',
      reference: callback.transactionReference,
      amount: callback.amount,
      sourceAccount: callback.sourceAccountNumber,
      destinationAccount: callback.destinationAccountNumber,
      status: callback.status === 'SUCCESS' ? GatewayTransactionStatus.SUCCESS : GatewayTransactionStatus.FAILED
    };
  }

  private getSourceAccountNumber(): string {
    return (window as any).env?.jengaSourceAccount || '';
  }
}

/**
 * KCB Buni API Service
 *
 * KCB (Kenya Commercial Bank) provides the Buni API gateway:
 * - Lipa na KCB (STK Push) — collect payments
 * - IPN (Instant Payment Notification) — real-time payment alerts
 * - PesaLink — inter-bank transfers
 * - Account queries
 *
 * API Docs: https://buni.kcbgroup.com/
 * Sandbox: https://sandbox.buni.kcbgroup.com/
 *
 * Key for Chama: IPN gives real-time bank payment notifications
 * — critical for reconciliation of bank transfers.
 */
@Injectable({ providedIn: 'root' })
export class KcbBuniService {
  private http = inject(HttpClient);

  private readonly SANDBOX_URL = 'https://sandbox.buni.kcbgroup.com';
  private readonly PRODUCTION_URL = 'https://buni.kcbgroup.com';

  private consumerKey = '';
  private consumerSecret = '';

  constructor() {
    this.consumerKey = (window as any).env?.kcbBuniConsumerKey || '';
    this.consumerSecret = (window as any).env?.kcbBuniConsumerSecret || '';
  }

  private getBaseUrl(): string {
    return this.PRODUCTION_URL;
  }

  /**
   * Get KCB Buni OAuth token.
   *
   * fineract-api: POST /oauth/token
   */
  getAccessToken(): Observable<string> {
    const credentials = btoa(`${this.consumerKey}:${this.consumerSecret}`);
    const headers = new HttpHeaders({
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = 'grant_type=client_credentials';

    return this.http
      .post<{ access_token: string; expires_in: number }>(`${this.getBaseUrl()}/oauth/token`, body, { headers })
      .pipe(map((response) => response.access_token));
  }

  /**
   * Process KCB IPN (Instant Payment Notification) callback.
   * KCB sends this in real-time when a customer pays to your account.
   *
   * @param callback - IPN callback data
   * @returns Processed payment data
   */
  processIpnCallback(callback: KcbIpnCallback): {
    isSuccessful: boolean;
    reference: string;
    amount: number;
    phoneNumber: string;
    accountNumber: string;
    mpesaReceiptNumber?: string;
    status: GatewayTransactionStatus;
  } {
    return {
      isSuccessful: callback.amount > 0 && callback.transactionRef?.length > 0,
      reference: callback.transactionRef,
      amount: callback.amount,
      phoneNumber: callback.phoneNumber,
      accountNumber: callback.accountNumber,
      status: GatewayTransactionStatus.SUCCESS
    };
  }
}

/**
 * Co-operative Bank COOP Connect Service
 *
 * Co-op Bank is very popular with SACCOs and Chamas in Kenya.
 * COOP Connect provides:
 * - PesaLink transfers
 * - Payment notifications
 * - Account queries
 *
 * API Docs: https://developer.co-opbank.co.ke/
 * Sandbox: Available at developer portal
 *
 * Strategic value: Co-op is the default bank for many Kenyan
 * community groups (Chamas, SACCOs, table banking groups).
 */
@Injectable({ providedIn: 'root' })
export class CoopConnectService {
  private http = inject(HttpClient);

  private readonly SANDBOX_URL = 'https://developer.co-opbank.co.ke';
  private readonly PRODUCTION_URL = 'https://api.co-opbank.co.ke';

  private apiKey = '';
  private secretKey = '';

  constructor() {
    this.apiKey = (window as any).env?.coopApiKey || '';
    this.secretKey = (window as any).env?.coopSecretKey || '';
  }

  private getBaseUrl(): string {
    return this.PRODUCTION_URL;
  }

  /**
   * Get COOP Connect access token.
   */
  getAccessToken(): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      apiKey: this.apiKey,
      secretKey: this.secretKey
    };

    return this.http
      .post<{ accessToken: string; expiresIn: number }>(`${this.getBaseUrl()}/auth/token`, body, { headers })
      .pipe(map((response) => response.accessToken));
  }

  /**
   * Process Co-op IPN callback.
   */
  processIpnCallback(callback: CoopCallback): {
    isSuccessful: boolean;
    reference: string;
    amount: number;
    phoneNumber: string;
    accountNumber: string;
    status: GatewayTransactionStatus;
  } {
    return {
      isSuccessful: callback.status === 'SUCCESS' && callback.amount > 0,
      reference: callback.transactionRef,
      amount: callback.amount,
      phoneNumber: callback.phoneNumber,
      accountNumber: callback.accountNumber,
      status: callback.status === 'SUCCESS' ? GatewayTransactionStatus.SUCCESS : GatewayTransactionStatus.FAILED
    };
  }
}
