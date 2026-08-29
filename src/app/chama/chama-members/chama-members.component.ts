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
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { ChamaMember } from '../models';
import { MemberStatus } from '../models/chama.enums';

@Component({
  selector: 'mifosx-chama-members',
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
  templateUrl: './chama-members.component.html',
  styleUrls: ['./chama-members.component.scss']
})
export class ChamaMembersComponent implements OnInit {
  private route = inject(ActivatedRoute);

  members: ChamaMember[] = [];
  displayedColumns = [
    'membershipNumber',
    'name',
    'status',
    'position',
    'totalContributions',
    'totalPayouts',
    'outstandingBalance',
    'actions'
  ];
  MemberStatus = MemberStatus;

  ngOnInit(): void {
    this.members = this.route.snapshot.data['members']?.content || [];
  }

  getStatusColor(status: MemberStatus): string {
    switch (status) {
      case MemberStatus.ACTIVE:
        return 'primary';
      case MemberStatus.PENDING:
        return 'accent';
      case MemberStatus.SUSPENDED:
        return 'warn';
      case MemberStatus.EXITED:
        return '';
      default:
        return '';
    }
  }
}
