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
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  PesapalOrderRequest,
  PesapalOrderResponse,
  PesapalTransactionStatus,
  PaymentProvider,
  GatewayTransactionStatus
} from '../models';

/**
 * Pesapal Payment Gateway Service
 *
 * Pesapal is Kenya's oldest payment gateway (since 2009), offering:
 * - M-Pesa (via Daraja integration)
 * - Card payments (Visa, Mastercard)
 * - Bank transfers
 * - Payment links for invoicing
 *
 * Key advantages for Chama:
 * - Single API for M-Pesa + cards + bank
 * - Built-in transaction reconciliation dashboard
 * - Supports recurring billing (for monthly contributions)
 * - Plug-and-play for WooCommerce/Shopify (if needed)
 *
 * API Docs: https://www.pesapal.com/developer
 * Sandbox: https://cyb.qa.pesapal.com/pesapalv3
 * Production: https://pay.pesapal.com/v3
 *
 * Fee: ~3.5% per transaction
 */
@Injectable({ providedIn: 'root' })
export class PesapalService {
  private http = inject(HttpClient);

  private readonly SANDBOX_URL = 'https://cyb.qa.pesapal.com/pesapalv3';
  private readonly PRODUCTION_URL = 'https://pay.pesapal.com/v3';

  private consumerKey = '';
  private consumerSecret = '';

  constructor() {
    this.consumerKey = (window as any).env?.pesapalConsumerKey || '';
    this.consumerSecret = (window as any).env?.pesapalConsumerSecret || '';
  }

  private getBaseUrl(): string {
    return this.PRODUCTION_URL;
  }

  /**
   * Get Pesapal OAuth token.
   * Tokens expire after 1 hour.
   *
   * fineract-api: POST /Auth/RequestToken
   */
  getAccessToken(): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      consumer_key: this.consumerKey,
      consumer_secret: this.consumerSecret
    };

    return this.http
      .post<{ token: string; expiryDate: string }>(`${this.getBaseUrl()}/Auth/RequestToken`, body, { headers })
      .pipe(map((response) => response.token));
  }

  /**
   * Create a payment order.
   * This generates a redirect URL where the customer completes payment.
   * Supports M-Pesa, cards, and bank transfers.
   *
   * fineract-api: POST /Transactions/InitiateRequest
   *
   * @param request - Order details with amount, member info, callback URL
   * @returns Observable with redirect URL for payment completion
   */
  createOrder(request: PesapalOrderRequest): Observable<PesapalOrderResponse> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });

        const body = {
          amount: request.amount,
          currency: 'KES',
          description: request.description,
          type: request.type,
          reference: request.reference,
          first_name: request.firstName,
          last_name: request.lastName,
          email: request.email,
          phone_number: request.phoneNumber,
          callback_url: request.callbackUrl
        };

        return { headers, body };
      })
    ) as unknown as Observable<PesapalOrderResponse>;
  }

  /**
   * Get transaction status by order tracking ID.
   * Use this to confirm payment after redirect or callback.
   *
   * fineract-api: GET /Transactions/GetTransactionDetails?orderTrackingId={id}
   *
   * @param orderTrackingId - The order tracking ID from createOrder response
   * @returns Observable with transaction status
   */
  getTransactionStatus(orderTrackingId: string): Observable<PesapalTransactionStatus> {
    return this.getAccessToken().pipe(
      map((token) => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });

        return { headers, orderTrackingId };
      })
    ) as unknown as Observable<PesapalTransactionStatus>;
  }

  /**
   * Process Pesapal IPN (Instant Payment Notification) callback.
   * Pesapal sends this to your registered URL when payment is completed.
   *
   * @param callback - Raw IPN callback data
   * @returns Processed transaction with status mapping
   */
  processIpnCallback(callback: {
    orderTrackingId: string;
    merchantReference: string;
    status: string;
    paymentMethod: string;
    amount: number;
  }): {
    isSuccessful: boolean;
    providerTransactionId: string;
    chamaReference: string;
    amount: number;
    paymentMethod: string;
    status: GatewayTransactionStatus;
  } {
    const statusMap: Record<string, GatewayTransactionStatus> = {
      COMPLETED: GatewayTransactionStatus.SUCCESS,
      FAILED: GatewayTransactionStatus.FAILED,
      PENDING: GatewayTransactionStatus.PROCESSING,
      REVERSED: GatewayTransactionStatus.REVERSED
    };

    return {
      isSuccessful: callback.status === 'COMPLETED',
      providerTransactionId: callback.orderTrackingId,
      chamaReference: callback.merchantReference,
      amount: callback.amount,
      paymentMethod: callback.paymentMethod,
      status: statusMap[callback.status] || GatewayTransactionStatus.UNKNOWN
    };
  }

  /**
   * Generate payment link for a contribution.
   * Useful for sending payment links via SMS/WhatsApp.
   *
   * @param memberId - Chama member ID
   * @param periodId - Contribution period ID
   * @param amount - Amount in KES
   * @param memberEmail - Member's email
   * @returns Observable with payment URL
   */
  generateContributionLink(
    memberId: number,
    periodId: number,
    amount: number,
    memberEmail: string
  ): Observable<string> {
    const request: PesapalOrderRequest = {
      amount,
      description: `Chama Contribution - Period ${periodId}`,
      type: 'MERCHANT',
      reference: `CHAMA-M${memberId}-P${periodId}`,
      firstName: '',
      lastName: '',
      email: memberEmail,
      callbackUrl: `${window.location.origin}/#/chama/contributions/callback`
    };

    return this.createOrder(request).pipe(map((response) => response.redirectUrl || ''));
  }
}
