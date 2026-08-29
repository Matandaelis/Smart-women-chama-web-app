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

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { ChamaService } from '../../chama.service';

@Component({
  selector: 'mifosx-chama-create-member',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MaterialModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ],
  templateUrl: './chama-create-member.component.html',
  styleUrls: ['./chama-create-member.component.scss']
})
export class ChamaCreateMemberComponent {
  private fb = inject(FormBuilder);
  private chamaService = inject(ChamaService);
  private router = inject(Router);

  memberForm: FormGroup = this.fb.group({
    firstName: [
      '',
      Validators.required
    ],
    lastName: [
      '',
      Validators.required
    ],
    phoneNumber: [
      '',
      Validators.required
    ],
    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],
    nationalId: [
      '',
      Validators.required
    ],
    payoutAccountNumber: [
      '',
      Validators.required
    ],
    payoutAccountBank: [
      '',
      Validators.required
    ],
    payoutAccountName: [
      '',
      Validators.required
    ]
  });

  onSubmit(): void {
    if (this.memberForm.valid) {
      this.chamaService.createMember(this.memberForm.value).subscribe({
        next: () => {
          this.router.navigate(['/chama/members']);
        },
        error: (error: unknown) => {
          console.error('Failed to create member', error);
        }
      });
    }
  }
}
