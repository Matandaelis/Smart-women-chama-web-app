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
import { ReconciliationRecord } from '../models';
import { ReconciliationStatus } from '../models/chama.enums';
import { ChamaService } from '../chama.service';

@Component({
  selector: 'mifosx-chama-reconciliation',
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
  templateUrl: './chama-reconciliation.component.html',
  styleUrls: ['./chama-reconciliation.component.scss']
})
export class ChamaReconciliationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private chamaService = inject(ChamaService);

  records: ReconciliationRecord[] = [];
  displayedColumns = [
    'transactionType',
    'providerTransactionId',
    'expectedAmount',
    'actualAmount',
    'status',
    'discrepancyType',
    'notes',
    'actions'
  ];
  ReconciliationStatus = ReconciliationStatus;

  ngOnInit(): void {
    this.records = this.route.snapshot.data['reconciliationRecords'] || [];
  }

  getStatusColor(status: ReconciliationStatus): string {
    switch (status) {
      case ReconciliationStatus.MATCHED:
        return 'primary';
      case ReconciliationStatus.UNMATCHED:
      case ReconciliationStatus.AMOUNT_MISMATCH:
      case ReconciliationStatus.DUPLICATE:
        return 'warn';
      default:
        return '';
    }
  }

  resolveRecord(record: ReconciliationRecord, newStatus: string): void {
    const notes = prompt('Resolution notes:');
    if (notes !== null) {
      this.chamaService.resolveReconciliation(record.id, { status: newStatus, notes }).subscribe();
    }
  }

  getUnresolvedCount(): number {
    return this.records.filter(
      (r) => r.status !== ReconciliationStatus.MATCHED && r.status !== ReconciliationStatus.REVERSED
    ).length;
  }
}
