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
  IntaSendPaymentRequest,
  IntaSendPaymentResponse,
  IntaSendB2CRequest,
  IntaSendWebhook,
  GatewayTransactionStatus
} from '../models';

/**
 * IntaSend Payment Gateway Service
 *
 * IntaSend is a Kenya-focused payment platform offering:
 * - M-Pesa STK Push (no Paybill application needed)
 * - Card payments (Visa, Mastercard, Apple Pay, Google Pay)
 * - Bank transfers (all Kenyan banks)
 * - Bulk B2C payouts to M-Pesa wallets
 * - Bulk bank transfers for salary/supplier payments
 *
 * Key advantages for Chama:
 * - Start accepting M-Pesa immediately (uses IntaSend's Paybill)
 * - No need to apply for own Safaricom Paybill
 * - Well-documented REST APIs with sandbox
 * - Unified dashboard for all transactions
 * - Transparent pricing (no monthly fees)
 *
 * API Docs: https://intasend.com/docs/
 * Sandbox: https://sandbox.intasend.com
 * Production: https://api.intasend.com
 *
 * Fee: ~2% per transaction (varies by volume)
 */
@Injectable({ providedIn: 'root' })
export class IntaSendService {
  private http = inject(HttpClient);

  private readonly SANDBOX_URL = 'https://sandbox.intasend.com';
  private readonly PRODUCTION_URL = 'https://api.intasend.com';

  private publishableKey = '';
  private secretKey = '';

  constructor() {
    this.publishableKey = (window as any).env?.intasendPublishableKey || '';
    this.secretKey = (window as any).env?.intasendSecretKey || '';
  }

  private getBaseUrl(): string {
    return this.PRODUCTION_URL;
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Initiate M-Pesa STK Push payment.
   * IntaSend handles the Daraja integration — you just pass phone + amount.
   *
   * fineract-api: POST /api/v1/collections/
   *
   * @param request - Payment details with phone, amount, reference
   * @returns Observable with payment ID and optional payment link
   */
  initiateStkPush(request: IntaSendPaymentRequest): Observable<IntaSendPaymentResponse> {
    const body = {
      amount: request.amount,
      currency: request.currency || 'KES',
      payment_method: request.paymentMethod || 'MPESA-STK-PUSH',
      phone_number: request.phoneNumber,
      narrative: request.narrative,
      api_ref: request.reference,
      webhook_url: request.webhookUrl
    };

    return this.http.post<IntaSendPaymentResponse>(`${this.getBaseUrl()}/api/v1/collections/`, body, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Check collection (inbound payment) status.
   *
   * fineract-api: GET /api/v1/collections/{id}/
   *
   * @param collectionId - The payment ID from initiateStkPush
   * @returns Observable with payment status
   */
  getCollectionStatus(collectionId: string): Observable<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    mpesa_receipt?: string;
    created_at: string;
    updated_at: string;
  }> {
    return this.http.get<{
      id: string;
      status: string;
      amount: number;
      currency: string;
      mpesa_receipt?: string;
      created_at: string;
      updated_at: string;
    }>(`${this.getBaseUrl()}/api/v1/collections/${collectionId}/`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Initiate B2C payout to member's M-Pesa wallet.
   * Used for rotation payouts.
   *
   * fineract-api: POST /api/v1/disbursements/
   *
   * @param request - B2C payment details
   * @returns Observable with disbursement ID
   */
  initiateDisbursement(request: IntaSendB2CRequest): Observable<{
    id: string;
    status: string;
    amount: number;
    destination: string;
  }> {
    const body = {
      amount: request.amount,
      currency: request.currency || 'KES',
      destination: request.destination,
      narrative: request.narrative,
      api_ref: request.reference
    };

    return this.http.post<{
      id: string;
      status: string;
      amount: number;
      destination: string;
    }>(`${this.getBaseUrl()}/api/v1/disbursements/`, body, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Check disbursement (outbound payment) status.
   *
   * fineract-api: GET /api/v1/disbursements/{id}/
   */
  getDisbursementStatus(disbursementId: string): Observable<{
    id: string;
    status: string;
    amount: number;
    destination: string;
    mpesa_receipt?: string;
    created_at: string;
    updated_at: string;
  }> {
    return this.http.get<{
      id: string;
      status: string;
      amount: number;
      destination: string;
      mpesa_receipt?: string;
      created_at: string;
      updated_at: string;
    }>(`${this.getBaseUrl()}/api/v1/disbursements/${disbursementId}/`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Process IntaSend webhook callback.
   * IntaSend sends webhooks for both collections and disbursements.
   *
   * @param webhook - Webhook payload
   * @returns Processed payment result
   */
  processWebhook(webhook: IntaSendWebhook): {
    isSuccessful: boolean;
    isCollection: boolean;
    isDisbursement: boolean;
    providerTransactionId: string;
    chamaReference: string;
    amount: number;
    mpesaReceipt?: string;
    status: GatewayTransactionStatus;
  } {
    const statusMap: Record<string, GatewayTransactionStatus> = {
      COMPLETE: GatewayTransactionStatus.SUCCESS,
      FAILED: GatewayTransactionStatus.FAILED,
      PROCESSING: GatewayTransactionStatus.PROCESSING,
      PENDING: GatewayTransactionStatus.PROCESSING
    };

    return {
      isSuccessful: webhook.status === 'COMPLETE',
      isCollection: !!webhook.mpesa_receipt,
      isDisbursement: !webhook.mpesa_receipt,
      providerTransactionId: webhook.id,
      chamaReference: webhook.api_ref,
      amount: webhook.amount,
      mpesaReceipt: webhook.mpesa_receipt,
      status: statusMap[webhook.status] || GatewayTransactionStatus.UNKNOWN
    };
  }
}
