/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NgModule } from '@angular/core';

import { ChamaRoutingModule } from './chama-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { PipesModule } from '../pipes/pipes.module';
import { DirectivesModule } from '../directives/directives.module';

import { ChamaComponent } from './chama.component';
import { ChamaMembersComponent } from './chama-members/chama-members.component';
import { ChamaMemberViewComponent } from './chama-members/chama-member-view/chama-member-view.component';
import { ChamaCreateMemberComponent } from './chama-members/chama-create-member/chama-create-member.component';
import { ChamaConfigurationComponent } from './chama-configuration/chama-configuration.component';
import { ChamaPeriodsComponent } from './chama-periods/chama-periods.component';
import { ChamaContributionsComponent } from './chama-contributions/chama-contributions.component';
import { ChamaPayoutsComponent } from './chama-payouts/chama-payouts.component';
import { ChamaReconciliationComponent } from './chama-reconciliation/chama-reconciliation.component';
import { ChamaGovernanceComponent } from './chama-governance/chama-governance.component';

/**
 * Chama Module
 *
 * All components related to Smart Women Chama should be declared here.
 */
@NgModule({
  imports: [
    SharedModule,
    ChamaRoutingModule,
    PipesModule,
    DirectivesModule,
    ChamaComponent,
    ChamaMembersComponent,
    ChamaMemberViewComponent,
    ChamaCreateMemberComponent,
    ChamaConfigurationComponent,
    ChamaPeriodsComponent,
    ChamaContributionsComponent,
    ChamaPayoutsComponent,
    ChamaReconciliationComponent,
    ChamaGovernanceComponent
  ]
})
export class ChamaModule {}
