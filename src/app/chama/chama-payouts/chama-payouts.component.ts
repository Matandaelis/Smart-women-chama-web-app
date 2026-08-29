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

/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { Payout } from '../models';
import { PayoutStatus } from '../models/chama.enums';
import { ChamaService } from '../chama.service';

@Component({
  selector: 'mifosx-chama-payouts',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './chama-payouts.component.html',
  styleUrls: ['./chama-payouts.component.scss']
})
export class ChamaPayoutsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private chamaService = inject(ChamaService);

  payouts: Payout[] = [];
  displayedColumns = [
    'recipient',
    'amount',
    'status',
    'providerTransactionId',
    'approvedBy',
    'completedAt',
    'actions'
  ];
  PayoutStatus = PayoutStatus;

  ngOnInit(): void {
    this.payouts = this.route.snapshot.data['payouts'] || [];
  }

  getStatusColor(status: PayoutStatus): string {
    switch (status) {
      case PayoutStatus.COMPLETED:
        return 'primary';
      case PayoutStatus.PENDING_APPROVAL:
        return 'accent';
      case PayoutStatus.FAILED:
      case PayoutStatus.REVERSED:
        return 'warn';
      default:
        return '';
    }
  }

  canApprove(payout: Payout): boolean {
    return payout.status === PayoutStatus.PENDING_APPROVAL;
  }

  canExecute(payout: Payout): boolean {
    return payout.status === PayoutStatus.APPROVED;
  }

  approvePayout(payout: Payout): void {
    const notes = prompt('Approval notes (optional):') || '';
    this.chamaService.approvePayout({ payoutId: payout.id, approved: true, notes }).subscribe();
  }

  executePayout(payout: Payout): void {
    if (confirm('Confirm payout execution?')) {
      this.chamaService.executePayout(payout.id).subscribe();
    }
  }

  reversePayout(payout: Payout): void {
    const reason = prompt('Reversal reason:');
    if (reason) {
      this.chamaService.reversePayout(payout.id, reason).subscribe();
    }
  }
}
