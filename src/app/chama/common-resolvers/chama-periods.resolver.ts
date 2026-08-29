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
import { Resolve } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { ChamaPeriod, ChamaCycle } from '../models';
import { ChamaService } from '../chama.service';

@Injectable({ providedIn: 'root' })
export class ChamaPeriodsResolver implements Resolve<{ periods: ChamaPeriod[]; activeCycle: ChamaCycle | null }> {
  private chamaService = inject(ChamaService);

  resolve(): Observable<{ periods: ChamaPeriod[]; activeCycle: ChamaCycle | null }> {
    return forkJoin({
      periods: this.chamaService.getPeriods(),
      activeCycle: this.chamaService.getActiveCycle()
    });
  }
}
