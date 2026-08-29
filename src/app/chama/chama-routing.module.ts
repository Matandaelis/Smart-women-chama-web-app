/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Route } from '../core/route/route.service';

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
import { ChamaMeetingsComponent } from './chama-meetings/chama-meetings.component';
import { ChamaSocialFundComponent } from './chama-social-fund/chama-social-fund.component';

import { ChamaDashboardResolver } from './common-resolvers/chama-dashboard.resolver';
import { ChamaMembersResolver } from './common-resolvers/chama-members.resolver';
import { ChamaMemberResolver } from './common-resolvers/chama-member.resolver';
import { ChamaConfigurationResolver } from './common-resolvers/chama-configuration.resolver';
import { ChamaPeriodsResolver } from './common-resolvers/chama-periods.resolver';
import { ChamaContributionsResolver } from './common-resolvers/chama-contributions.resolver';
import { ChamaPayoutsResolver } from './common-resolvers/chama-payouts.resolver';
import { ChamaReconciliationResolver } from './common-resolvers/chama-reconciliation.resolver';
import { ChamaGovernanceResolver } from './common-resolvers/chama-governance.resolver';
import { ChamaMeetingsResolver } from './common-resolvers/chama-meetings.resolver';
import { ChamaSocialFundResolver } from './common-resolvers/chama-social-fund.resolver';

const routes: Routes = [
  Route.withShell([
    {
      path: '',
      data: { title: 'Smart Women Chama', breadcrumb: 'Chama' },
      children: [
        {
          path: '',
          component: ChamaComponent,
          resolve: {
            dashboard: ChamaDashboardResolver
          }
        },
        {
          path: 'members',
          data: { title: 'Members', breadcrumb: 'Members' },
          children: [
            {
              path: '',
              component: ChamaMembersComponent,
              resolve: {
                members: ChamaMembersResolver
              }
            },
            {
              path: 'create',
              component: ChamaCreateMemberComponent,
              data: { title: 'Add Member', breadcrumb: 'Add' }
            },
            {
              path: ':memberId',
              component: ChamaMemberViewComponent,
              data: { title: 'Member View', routeParamBreadcrumb: 'memberId' },
              resolve: {
                memberData: ChamaMemberResolver
              }
            }
          ]
        },
        {
          path: 'configuration',
          component: ChamaConfigurationComponent,
          data: { title: 'Configuration', breadcrumb: 'Configuration' },
          resolve: {
            configuration: ChamaConfigurationResolver
          }
        },
        {
          path: 'periods',
          component: ChamaPeriodsComponent,
          data: { title: 'Periods', breadcrumb: 'Periods' },
          resolve: {
            periodsData: ChamaPeriodsResolver
          }
        },
        {
          path: 'contributions',
          component: ChamaContributionsComponent,
          data: { title: 'Contributions', breadcrumb: 'Contributions' },
          resolve: {
            requirements: ChamaContributionsResolver
          }
        },
        {
          path: 'payouts',
          component: ChamaPayoutsComponent,
          data: { title: 'Payouts', breadcrumb: 'Payouts' },
          resolve: {
            payouts: ChamaPayoutsResolver
          }
        },
        {
          path: 'reconciliation',
          component: ChamaReconciliationComponent,
          data: { title: 'Reconciliation', breadcrumb: 'Reconciliation' },
          resolve: {
            reconciliationRecords: ChamaReconciliationResolver
          }
        },
        {
          path: 'governance',
          component: ChamaGovernanceComponent,
          data: { title: 'Governance', breadcrumb: 'Governance' },
          resolve: {
            governanceData: ChamaGovernanceResolver
          }
        },
        {
          path: 'meetings',
          component: ChamaMeetingsComponent,
          data: { title: 'Meetings', breadcrumb: 'Meetings' },
          resolve: {
            meetings: ChamaMeetingsResolver
          }
        },
        {
          path: 'social-fund',
          component: ChamaSocialFundComponent,
          data: { title: 'Social Fund', breadcrumb: 'Social Fund' },
          resolve: {
            socialFund: ChamaSocialFundResolver
          }
        }
      ]
    }
  ])
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [
    ChamaDashboardResolver,
    ChamaMembersResolver,
    ChamaMemberResolver,
    ChamaConfigurationResolver,
    ChamaPeriodsResolver,
    ChamaContributionsResolver,
    ChamaPayoutsResolver,
    ChamaReconciliationResolver,
    ChamaGovernanceResolver,
    ChamaMeetingsResolver,
    ChamaSocialFundResolver
  ]
})
export class ChamaRoutingModule {}
