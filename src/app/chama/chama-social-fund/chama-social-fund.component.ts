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
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { SocialFund, SocialFundContribution, SocialFundDisbursement } from '../models';
import { SocialFundPurpose, PayoutStatus } from '../models/chama.enums';
import { ChamaService } from '../chama.service';

@Component({
  selector: 'mifosx-chama-social-fund',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    TranslateModule
  ],
  templateUrl: './chama-social-fund.component.html',
  styleUrls: ['./chama-social-fund.component.scss']
})
export class ChamaSocialFundComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private chamaService = inject(ChamaService);

  socialFund: SocialFund | null = null;
  contributions: SocialFundContribution[] = [];
  disbursements: SocialFundDisbursement[] = [];
  contributionColumns = [
    'memberName',
    'amount',
    'paymentDate',
    'periodId'
  ];
  disbursementColumns = [
    'memberName',
    'amount',
    'purpose',
    'status',
    'approvedByName',
    'disbursementDate',
    'actions'
  ];
  SocialFundPurpose = SocialFundPurpose;
  PayoutStatus = PayoutStatus;

  ngOnInit(): void {
    this.socialFund = this.route.snapshot.data['socialFund'] || null;
    this.contributions = this.route.snapshot.data['contributions'] || [];
    this.disbursements = this.route.snapshot.data['disbursements'] || [];
  }

  approveDisbursement(disbursement: SocialFundDisbursement): void {
    this.chamaService.approveSocialFundDisbursement(disbursement.id, true).subscribe();
  }

  rejectDisbursement(disbursement: SocialFundDisbursement): void {
    if (confirm('Reject this disbursement request?')) {
      this.chamaService.approveSocialFundDisbursement(disbursement.id, false).subscribe();
    }
  }

  getStatusColor(status: PayoutStatus): string {
    switch (status) {
      case PayoutStatus.COMPLETED:
        return 'primary';
      case PayoutStatus.PENDING_APPROVAL:
        return 'accent';
      case PayoutStatus.FAILED:
        return 'warn';
      default:
        return '';
    }
  }

  canApprove(disbursement: SocialFundDisbursement): boolean {
    return disbursement.status === PayoutStatus.PENDING_APPROVAL;
  }
}
