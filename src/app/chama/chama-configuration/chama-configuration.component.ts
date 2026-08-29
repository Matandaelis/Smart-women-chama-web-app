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
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { ChamaConfiguration } from '../models';
import { ContributionFrequency, RotationMethod } from '../models/chama.enums';
import { ChamaService } from '../chama.service';

@Component({
  selector: 'mifosx-chama-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    TranslateModule
  ],
  templateUrl: './chama-configuration.component.html',
  styleUrls: ['./chama-configuration.component.scss']
})
export class ChamaConfigurationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private chamaService = inject(ChamaService);

  configuration!: ChamaConfiguration;
  configForm!: FormGroup;
  frequencies = Object.values(ContributionFrequency);
  rotationMethods = Object.values(RotationMethod);

  ngOnInit(): void {
    this.configuration = this.route.snapshot.data['configuration'];
    this.initForm();
  }

  private initForm(): void {
    this.configForm = this.fb.group({
      name: [
        this.configuration.name,
        Validators.required
      ],
      contributionAmount: [
        this.configuration.contributionAmount,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],
      contributionFrequency: [
        this.configuration.contributionFrequency,
        Validators.required
      ],
      rotationMethod: [
        this.configuration.rotationMethod,
        Validators.required
      ],
      approvalRequiredForPayout: [this.configuration.approvalRequiredForPayout],
      payoutRequireFullPool: [this.configuration.payoutPolicy.requireFullPool],
      payoutAllowPartial: [this.configuration.payoutPolicy.allowPartialPayout],
      latePaymentEnabled: [this.configuration.latePaymentPolicy.enabled],
      latePaymentGraceDays: [this.configuration.latePaymentPolicy.gracePeriodDays],
      lateFeeAmount: [this.configuration.latePaymentPolicy.lateFeeAmount],
      lateFeeType: [this.configuration.latePaymentPolicy.lateFeeType]
    });
  }

  onSubmit(): void {
    if (this.configForm.valid) {
      const formValue = this.configForm.value;
      const update: Partial<ChamaConfiguration> = {
        name: formValue.name,
        contributionAmount: formValue.contributionAmount,
        contributionFrequency: formValue.contributionFrequency,
        rotationMethod: formValue.rotationMethod,
        approvalRequiredForPayout: formValue.approvalRequiredForPayout,
        payoutPolicy: {
          requireFullPool: formValue.payoutRequireFullPool,
          allowPartialPayout: formValue.payoutAllowPartial,
          approvalThreshold: this.configuration.payoutPolicy.approvalThreshold
        },
        latePaymentPolicy: {
          enabled: formValue.latePaymentEnabled,
          gracePeriodDays: formValue.latePaymentGraceDays,
          lateFeeAmount: formValue.lateFeeAmount,
          lateFeeType: formValue.lateFeeType
        }
      };
      this.chamaService.updateConfiguration(update).subscribe({
        next: (updated) => {
          this.configuration = updated;
        }
      });
    }
  }
}
