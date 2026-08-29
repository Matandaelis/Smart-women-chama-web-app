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

import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { ChamaMember, ContributionRequirement } from '../models';
import { ChamaService } from '../chama.service';

@Injectable({ providedIn: 'root' })
export class ChamaMemberResolver implements Resolve<{ member: ChamaMember; contributions: ContributionRequirement[] }> {
  private chamaService = inject(ChamaService);

  resolve(
    route: ActivatedRouteSnapshot
  ): Observable<{ member: ChamaMember; contributions: ContributionRequirement[] }> {
    const memberId = Number(route.paramMap.get('memberId'));
    return forkJoin({
      member: this.chamaService.getMember(memberId),
      contributions: this.chamaService.getMemberContributions(memberId)
    });
  }
}
