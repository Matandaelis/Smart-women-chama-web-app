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
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../../shared/material.module';
import { PaymentGatewayService } from '../payment-gateway.service';
import {
  PaymentReconciliationRecord,
  PaymentReconciliationSummary,
  PaymentReconciliationStatus,
  PaymentProvider
} from '../models';

@Component({
  selector: 'mifosx-payment-reconciliation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    MatTableModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressBarModule,
    TranslateModule
  ],
  templateUrl: './payment-reconciliation.component.html',
  styleUrls: ['./payment-reconciliation.component.scss']
})
export class PaymentReconciliationComponent implements OnInit {
  private paymentGateway = inject(PaymentGatewayService);
  private snackBar = inject(MatSnackBar);

  summary: PaymentReconciliationSummary | null = null;
  records: PaymentReconciliationRecord[] = [];
  isLoading = false;
  selectedProvider: PaymentProvider | 'ALL' = 'ALL';

  startDate = new Date();
  endDate = new Date();

  readonly providerOptions = [
    { value: 'ALL', label: 'All Providers' },
    { value: PaymentProvider.MPESA_DARAJA, label: 'M-Pesa Daraja' },
    { value: PaymentProvider.PESAPAL, label: 'Pesapal' },
    { value: PaymentProvider.INTASEND, label: 'IntaSend' },
    { value: PaymentProvider.EQUITY_JENGA, label: 'Equity Jenga' },
    { value: PaymentProvider.KCB_BUNI, label: 'KCB Buni' },
    { value: PaymentProvider.COOP_CONNECT, label: 'Co-op Connect' }
  ];

  readonly displayedColumns = [
    'providerTransactionId',
    'provider',
    'internalAmount',
    'providerAmount',
    'amountsMatch',
    'status',
    'payerReference',
    'providerTimestamp',
    'actions'
  ];

  readonly statusColors: Record<string, string> = {
    MATCHED: 'primary',
    INTERNAL_ONLY: 'warn',
    PROVIDER_ONLY: 'accent',
    AMOUNT_MISMATCH: 'warn',
    DUPLICATE: 'warn',
    PENDING_REVIEW: 'primary',
    RESOLVED: 'primary',
    REVERSED: 'warn'
  };

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadReconciliation();
  }

  private setDefaultDates(): void {
    const today = new Date();
    this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.endDate = new Date(today);
  }

  loadReconciliation(): void {
    this.isLoading = true;
    const startDateStr = this.formatDate(this.startDate);
    const endDateStr = this.formatDate(this.endDate);
    const provider = this.selectedProvider === 'ALL' ? undefined : this.selectedProvider;

    this.paymentGateway.getReconciliationSummary(startDateStr, endDateStr, provider).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.records = summary.records;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load reconciliation data', 'Close', {
          duration: 3000
        });
      }
    });
  }

  resolveRecord(record: PaymentReconciliationRecord): void {
    const resolution = {
      status: PaymentReconciliationStatus.RESOLVED,
      notes: 'Resolved by admin review'
    };

    this.paymentGateway.resolveReconciliation(record.id, resolution).subscribe({
      next: () => {
        this.snackBar.open('Reconciliation resolved', 'Close', { duration: 2000 });
        this.loadReconciliation();
      },
      error: () => {
        this.snackBar.open('Failed to resolve', 'Close', { duration: 3000 });
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
