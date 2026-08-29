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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { ContributionRequirement, ContributionPayment } from '../models';
import { ContributionStatus, PaymentTiming } from '../models/chama.enums';
import { ChamaService } from '../chama.service';

@Component({
  selector: 'mifosx-chama-contributions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './chama-contributions.component.html',
  styleUrls: ['./chama-contributions.component.scss']
})
export class ChamaContributionsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private chamaService = inject(ChamaService);
  private dialog = inject(MatDialog);

  requirements: ContributionRequirement[] = [];
  paymentForm!: FormGroup;
  showPaymentForm = false;
  displayedColumns = [
    'memberName',
    'amountDue',
    'amountPaid',
    'outstandingAmount',
    'lateFees',
    'paymentTiming',
    'status',
    'actions'
  ];
  ContributionStatus = ContributionStatus;
  PaymentTiming = PaymentTiming;

  ngOnInit(): void {
    this.requirements = this.route.snapshot.data['requirements'] || [];
    this.initPaymentForm();
  }

  private initPaymentForm(): void {
    this.paymentForm = this.fb.group({
      memberId: [
        '',
        Validators.required
      ],
      periodId: [
        '',
        Validators.required
      ],
      amount: [
        '',
        [
          Validators.required,
          Validators.min(1)
        ]
      ],
      paymentMethod: [
        'MOBILE_MONEY',
        Validators.required
      ],
      providerTransactionId: [
        '',
        Validators.required
      ],
      reference: [''],
      notes: ['']
    });
  }

  togglePaymentForm(): void {
    this.showPaymentForm = !this.showPaymentForm;
  }

  recordPayment(): void {
    if (this.paymentForm.valid) {
      this.chamaService.recordPayment(this.paymentForm.value).subscribe({
        next: () => {
          this.showPaymentForm = false;
          this.paymentForm.reset();
        }
      });
    }
  }

  waiveContribution(requirement: ContributionRequirement): void {
    const reason = prompt('Enter waiver reason:');
    if (reason) {
      this.chamaService.waiveContribution(requirement.id, reason).subscribe();
    }
  }

  getOutstandingTotal(): number {
    return this.requirements.reduce((sum, r) => sum + r.outstandingAmount, 0);
  }

  getOverdueCount(): number {
    return this.requirements.filter((r) => r.status === ContributionStatus.OVERDUE).length;
  }
}
