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
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { GovernanceMeeting, AuditEvent } from '../models';
import { ChamaService } from '../chama.service';

@Component({
  selector: 'mifosx-chama-governance',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatExpansionModule,
    MatTableModule,
    TranslateModule
  ],
  templateUrl: './chama-governance.component.html',
  styleUrls: ['./chama-governance.component.scss']
})
export class ChamaGovernanceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private chamaService = inject(ChamaService);

  meetings: GovernanceMeeting[] = [];
  auditEvents: AuditEvent[] = [];
  auditDisplayedColumns = [
    'timestamp',
    'actorName',
    'action',
    'entityType',
    'entityId',
    'reference'
  ];

  ngOnInit(): void {
    this.meetings = this.route.snapshot.data['meetings'] || [];
    this.auditEvents = this.route.snapshot.data['auditEvents']?.content || [];
  }

  voteResolution(meetingId: number, resolutionId: number, vote: 'APPROVE' | 'REJECT' | 'ABSTAIN'): void {
    this.chamaService.voteResolution(meetingId, resolutionId, vote).subscribe();
  }

  loadMoreAuditEvents(): void {
    const nextPage = Math.floor(this.auditEvents.length / 25);
    this.chamaService.getAuditEvents(undefined, undefined, nextPage).subscribe((response) => {
      this.auditEvents = [
        ...this.auditEvents,
        ...response.content
      ];
    });
  }
}
