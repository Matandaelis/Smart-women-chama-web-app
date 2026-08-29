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
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ChamaService } from '../chama.service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { ChamaPeriod, ChamaCycle } from '../models';
import { PeriodStatus, CycleStatus } from '../models/chama.enums';

@Component({
  selector: 'mifosx-chama-periods',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './chama-periods.component.html',
  styleUrls: ['./chama-periods.component.scss']
})
export class ChamaPeriodsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private chamaService = inject(ChamaService);

  periods: ChamaPeriod[] = [];
  activeCycle: ChamaCycle | null = null;
  displayedColumns = [
    'periodNumber',
    'recipient',
    'startDate',
    'endDate',
    'expectedPool',
    'collectedPool',
    'status',
    'payoutStatus',
    'actions'
  ];
  PeriodStatus = PeriodStatus;
  CycleStatus = CycleStatus;

  ngOnInit(): void {
    this.periods = this.route.snapshot.data['periods'] || [];
    this.activeCycle = this.route.snapshot.data['activeCycle'];
  }

  getStatusColor(status: PeriodStatus): string {
    switch (status) {
      case PeriodStatus.CLOSED:
      case PeriodStatus.PAID:
        return 'primary';
      case PeriodStatus.COLLECTING:
      case PeriodStatus.OPEN:
        return 'accent';
      case PeriodStatus.SHORTFALL:
        return 'warn';
      case PeriodStatus.SUSPENDED:
        return 'warn';
      default:
        return '';
    }
  }

  canOpenPeriod(period: ChamaPeriod): boolean {
    return period.status === PeriodStatus.UPCOMING;
  }

  canClosePeriod(period: ChamaPeriod): boolean {
    return period.status === PeriodStatus.PAID || period.status === PeriodStatus.READY_FOR_PAYOUT;
  }

  openPeriod(period: ChamaPeriod): void {
    this.chamaService.openPeriod(period.id).subscribe();
  }

  closePeriod(period: ChamaPeriod): void {
    if (confirm('Confirm period closure? This action is irreversible.')) {
      this.chamaService.closePeriod(period.id).subscribe();
    }
  }
}
