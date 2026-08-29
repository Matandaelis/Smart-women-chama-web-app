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

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../../shared/material.module';
import { PaymentGatewayService } from '../payment-gateway.service';
import { PaymentProvider, PaymentMethod } from '../models';

interface ProviderDisplay {
  name: string;
  icon: string;
  provider: PaymentProvider;
  canCollect: boolean;
  canDisburse: boolean;
  methods: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'CONFIGURED';
  fee: string;
  description: string;
}

@Component({
  selector: 'mifosx-payment-methods',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.scss']
})
export class PaymentMethodsComponent implements OnInit {
  private paymentGateway = inject(PaymentGatewayService);

  providers: ProviderDisplay[] = [];

  readonly methodLabels: Record<string, string> = {
    MPESA_STK_PUSH: 'M-Pesa STK Push',
    MPESA_PAYBILL: 'M-Pesa Paybill',
    MPESA_TILL: 'M-Pesa Till',
    MPESA_SEND_MONEY: 'M-Pesa Send Money',
    BANK_PESALINK: 'PesaLink (Bank Transfer)',
    BANK_RTGS: 'RTGS (High Value)',
    BANK_EFT: 'EFT (Batch)',
    CARD: 'Card (Visa/Mastercard)',
    CASH: 'Cash',
    OTHER: 'Other'
  };

  ngOnInit(): void {
    this.loadProviders();
  }

  private loadProviders(): void {
    const providerInfo: Record<PaymentProvider, Partial<ProviderDisplay>> = {
      [PaymentProvider.MPESA_DARAJA]: {
        name: 'Safaricom M-Pesa (Daraja)',
        icon: 'phone_android',
        fee: '0.5% + KES 25',
        description: 'Direct integration with Safaricom. STK Push, Paybill, Till, B2C payouts.',
        status: 'ACTIVE'
      },
      [PaymentProvider.PESAPAL]: {
        name: 'Pesapal',
        icon: 'credit_card',
        fee: '3.5%',
        description: 'Unified gateway: M-Pesa + cards + bank transfers. Plug-and-play.',
        status: 'CONFIGURED'
      },
      [PaymentProvider.INTASEND]: {
        name: 'IntaSend',
        icon: 'send',
        fee: '~2%',
        description: 'Kenya-focused: M-Pesa STK Push (no Paybill needed) + bulk B2C.',
        status: 'CONFIGURED'
      },
      [PaymentProvider.EQUITY_JENGA]: {
        name: 'Equity Jenga / PesaLink',
        icon: 'account_balance',
        fee: 'KES 50-150',
        description: 'Bank-to-bank transfers via PesaLink. Accept Equity account payments.',
        status: 'CONFIGURED'
      },
      [PaymentProvider.KCB_BUNI]: {
        name: 'KCB Buni',
        icon: 'account_balance',
        fee: 'KES 50-150',
        description: 'KCB bank API: IPN notifications, PesaLink, Lipa na KCB.',
        status: 'CONFIGURED'
      },
      [PaymentProvider.COOP_CONNECT]: {
        name: 'Co-op Connect',
        icon: 'groups',
        fee: 'KES 50-100',
        description: 'Co-operative Bank API. Popular with SACCOs and Chamas.',
        status: 'INACTIVE'
      },
      [PaymentProvider.PESALINK]: {
        name: 'PesaLink',
        icon: 'swap_horiz',
        fee: 'KES 50-150',
        description: 'Kenya Bankers Association instant inter-bank transfers.',
        status: 'ACTIVE'
      },
      [PaymentProvider.RTGS]: {
        name: 'RTGS',
        icon: 'timeline',
        fee: 'KES 500+',
        description: 'Real-Time Gross Settlement for high-value transfers (KES 1M+).',
        status: 'INACTIVE'
      },
      [PaymentProvider.EFT]: {
        name: 'EFT',
        icon: 'schedule',
        fee: 'KES 100-200',
        description: 'Electronic Funds Transfer. 1-3 business days settlement.',
        status: 'INACTIVE'
      },
      [PaymentProvider.MANUAL]: {
        name: 'Manual / Cash',
        icon: 'payments',
        fee: 'None',
        description: 'Record cash or manual payments with audit trail.',
        status: 'ACTIVE'
      }
    };

    this.paymentGateway.getActiveProviders().subscribe((activeProviders) => {
      this.providers = activeProviders.map((p) => ({
        ...providerInfo[p.provider],
        provider: p.provider,
        canCollect: p.canCollect,
        canDisburse: p.canDisburse,
        methods: p.supportedMethods.map((m) => this.methodLabels[m] || m)
      })) as ProviderDisplay[];
    });
  }
}
