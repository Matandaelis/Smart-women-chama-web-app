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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChamaService } from '../../chama.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { ChamaMember, ContributionRequirement } from '../../models';
import { MemberStatus, ExitResolution } from '../../models/chama.enums';

@Component({
  selector: 'mifosx-chama-member-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    TranslateModule
  ],
  templateUrl: './chama-member-view.component.html',
  styleUrls: ['./chama-member-view.component.scss']
})
export class ChamaMemberViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private chamaService = inject(ChamaService);
  private router = inject(Router);

  member!: ChamaMember;
  contributions: ContributionRequirement[] = [];
  MemberStatus = MemberStatus;

  ngOnInit(): void {
    const data = this.route.snapshot.data['memberData'];
    if (data) {
      this.member = data.member;
      this.contributions = data.contributions || [];
    }
  }

  canSuspend(): boolean {
    return this.member.status === MemberStatus.ACTIVE;
  }

  canExit(): boolean {
    return this.member.status === MemberStatus.ACTIVE || this.member.status === MemberStatus.SUSPENDED;
  }

  canReactivate(): boolean {
    return this.member.status === MemberStatus.SUSPENDED;
  }

  suspend(): void {
    const reason = prompt('Enter suspension reason:');
    if (reason) {
      this.chamaService.suspendMember(this.member.id, reason).subscribe(() => {
        this.router.navigate(['/chama/members']);
      });
    }
  }

  reactivate(): void {
    this.chamaService.reactivateMember(this.member.id).subscribe(() => {
      this.router.navigate(['/chama/members']);
    });
  }

  exit(): void {
    const reason = prompt('Enter exit reason:');
    if (reason) {
      this.chamaService
        .exitMember({
          memberId: this.member.id,
          reason,
          resolution: ExitResolution.DEBT_FOLLOWS
        })
        .subscribe(() => {
          this.router.navigate(['/chama/members']);
        });
    }
  }
}
