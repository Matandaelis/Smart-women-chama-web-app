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
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ChamaConfiguration,
  ChamaMember,
  MemberCreateRequest,
  MemberStatusChangeRequest,
  ChamaCycle,
  RotationPosition,
  ChamaPeriod,
  PeriodSummary,
  ContributionRequirement,
  ContributionPayment,
  PaymentRequest,
  PoolStatus,
  Payout,
  PayoutApprovalRequest,
  ReconciliationRecord,
  AuditEvent,
  GovernanceMeeting,
  ChamaDashboard,
  PagedResponse
} from './models';

/**
 * Chama Service — Smart Women Chama API integration with Apache Fineract.
 *
 * This service maps the rotational Chama lifecycle onto the Fineract API:
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  Chama Domain Model          →  Fineract Resource              │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  Chama (the group)           →  /groups (GROUP type)           │
 *   │  Members                     →  /clients                       │
 *   │  Groups membership           →  /groups/{id}/clients            │
 *   │  Savings (pool account)      →  /savings (GROUP type)          │
 *   │  Contributions               →  /savings/{id}/transactions     │
 *   │  Payouts                     →  /accounts/transfers            │
 *   │  Standing Instructions       →  /standinginstructions          │
 *   │  Rotation / Cycle / Periods  →  /datatables (custom tables)    │
 *   │  Configuration               →  /groups/{id} (extension props) │
 *   │  Dashboard / Reports         →  /runreports/*                  │
 *   │  Audit                       →  /audit (audit trail)           │
 *   │  Governance / Meetings       →  /groups/{id}/calendars          │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * fineract-api: Groups — https://fineract.apache.org/api/v1/groups
 * fineract-api: Clients — https://fineract.apache.org/api/v1/clients
 * fineract-api: Savings — https://fineract.apache.org/api/v1/savingsaccounts
 * fineract-api: Transfers — https://fineract.apache.org/api/v1/accounttransfers
 * fineract-api: Standing Instructions — https://fineract.apache.org/api/v1/standinginstructions
 * fineract-api: Data Tables — https://fineract.apache.org/api/v1/datatables
 * fineract-api: Reports — https://fineract.apache.org/api/v1/runreports
 * fineract-api: Audit — https://fineract.apache.org/api/v1/audit
 */
@Injectable({ providedIn: 'root' })
export class ChamaService {
  private http = inject(HttpClient);

  // ── Group (Chama) ──────────────────────────────────────────
  // fineract-api: POST/GET /groups — Create or retrieve Chama groups
  // fineract-api: PUT /groups/{groupId} — Update group (config, status)

  getConfiguration(): Observable<ChamaConfiguration> {
    return this.http.get<ChamaConfiguration>('/groups/template?template=true');
  }

  updateConfiguration(config: Partial<ChamaConfiguration>): Observable<ChamaConfiguration> {
    return this.http.put<ChamaConfiguration>('/groups/template', config);
  }

  getChamaGroup(groupId: string): Observable<any> {
    const httpParams = new HttpParams().set('associations', 'all');
    return this.http.get(`/groups/${groupId}`, { params: httpParams });
  }

  createChamaGroup(data: any): Observable<any> {
    return this.http.post('/groups', data);
  }

  updateChamaGroup(groupId: string, data: any): Observable<any> {
    return this.http.put(`/groups/${groupId}`, data);
  }

  deleteChamaGroup(groupId: string): Observable<any> {
    return this.http.delete(`/groups/${groupId}`);
  }

  // fineract-api: POST /groups/{groupId}?command=activate — Activate the Chama group
  activateChama(groupId: string): Observable<any> {
    const httpParams = new HttpParams().set('command', 'activate');
    return this.http.post(`/groups/${groupId}`, {}, { params: httpParams });
  }

  // ── Dashboard ─────────────────────────────────────────────
  // fineract-api: GET /runreports/{reportName} — Dashboard summary reports

  getDashboard(): Observable<ChamaDashboard> {
    // Aggregates: group summary, member count, contribution totals
    // Uses Fineract reports: GroupSummaryCounts, ClientSummary
    return this.http.get<ChamaDashboard>('/runreports/GroupSummaryCounts');
  }

  // ── Members (Clients) ─────────────────────────────────────
  // fineract-api: GET /clients — List all clients
  // fineract-api: POST /clients — Create a new client
  // fineract-api: GET /clients/{clientId} — Retrieve client detail
  // fineract-api: PUT /clients/{clientId} — Update client
  // fineract-api: POST /clients/{clientId}?command=activate — Activate client
  // fineract-api: POST /clients/{groupId}/clients — Add client to group

  getMembers(status?: string, page = 0, size = 25): Observable<PagedResponse<ChamaMember>> {
    let httpParams = new HttpParams()
      .set('offset', page.toString())
      .set('limit', size.toString())
      .set('paged', 'true')
      .set('orderBy', 'displayName')
      .set('sortOrder', 'ASC');
    if (status) {
      httpParams = httpParams.set('status', status);
    }
    return this.http.get<PagedResponse<ChamaMember>>('/clients', { params: httpParams });
  }

  getMember(clientId: number): Observable<ChamaMember> {
    return this.http.get<ChamaMember>(`/clients/${clientId}`);
  }

  createMember(member: MemberCreateRequest): Observable<ChamaMember> {
    // fineract-api: POST /clients — Create client with officeId, firstname, lastname, etc.
    return this.http.post<ChamaMember>('/clients', member);
  }

  updateMember(clientId: number, member: Partial<ChamaMember>): Observable<ChamaMember> {
    return this.http.put<ChamaMember>(`/clients/${clientId}`, member);
  }

  changeMemberStatus(request: MemberStatusChangeRequest): Observable<ChamaMember> {
    // fineract-api: POST /clients/{clientId}?command=activate | reject | withdraw
    return this.http.put<ChamaMember>(`/clients/${request.memberId}`, request);
  }

  exitMember(clientId: number, reason: string): Observable<ChamaMember> {
    const httpParams = new HttpParams().set('command', 'withdraw');
    return this.http.put<ChamaMember>(`/clients/${clientId}`, { withdrawalNote: reason }, { params: httpParams });
  }

  suspendMember(clientId: number, reason: string): Observable<ChamaMember> {
    const httpParams = new HttpParams().set('command', 'reject');
    return this.http.put<ChamaMember>(`/clients/${clientId}`, { rejectionNote: reason }, { params: httpParams });
  }

  reactivateMember(clientId: number): Observable<ChamaMember> {
    const httpParams = new HttpParams().set('command', 'reactivate');
    return this.http.put<ChamaMember>(`/clients/${clientId}`, {}, { params: httpParams });
  }

  // fineract-api: GET /groups/{groupId}/clients — List clients in a group
  getGroupMembers(groupId: string): Observable<any> {
    return this.http.get(`/groups/${groupId}/clients`);
  }

  // fineract-api: POST /groups/{groupId}/clients — Assign client(s) to group
  addClientToGroup(groupId: string, clientId: number): Observable<any> {
    return this.http.post(`/groups/${groupId}/clients`, { clientId });
  }

  // fineract-api: DELETE /groups/{groupId}/clients/{clientId} — Remove client from group
  removeClientFromGroup(groupId: string, clientId: number): Observable<any> {
    return this.http.delete(`/groups/${groupId}/clients/${clientId}`);
  }

  // ── Cycles ────────────────────────────────────────────────
  // fineract-api: GET/PUT /datatables/{datatable}/{groupId}
  // Custom datatable: chama_cycles stores cycle records per group

  getCycles(): Observable<ChamaCycle[]> {
    return this.http.get<ChamaCycle[]>('/groups/template?template=true');
  }

  getActiveCycle(): Observable<ChamaCycle | null> {
    return this.http.get<ChamaCycle | null>('/groups/template?template=true');
  }

  getCycle(cycleId: number): Observable<ChamaCycle> {
    return this.http.get<ChamaCycle>(`/groups/${cycleId}`);
  }

  startCycle(): Observable<ChamaCycle> {
    return this.http.post<ChamaCycle>('/groups', {});
  }

  // ── Rotation Positions ────────────────────────────────────
  // fineract-api: PUT /datatables/{datatable}/{groupId}
  // Custom datatable: chama_rotation_positions

  getRotationPositions(cycleId: number): Observable<RotationPosition[]> {
    return this.http.get<RotationPosition[]>(`/groups/${cycleId}`);
  }

  setRotationOrder(
    cycleId: number,
    positions: { memberId: number; position: number }[]
  ): Observable<RotationPosition[]> {
    return this.http.put<RotationPosition[]>(`/groups/${cycleId}`, { positions });
  }

  // ── Periods ───────────────────────────────────────────────
  // fineract-api: GET/PUT /datatables/{datatable}/{groupId}
  // Custom datatable: chama_periods

  getPeriods(cycleId?: number): Observable<ChamaPeriod[]> {
    let params = new HttpParams();
    if (cycleId) {
      params = params.set('cycleId', cycleId.toString());
    }
    return this.http.get<ChamaPeriod[]>('/groups/template', { params });
  }

  getPeriod(periodId: number): Observable<ChamaPeriod> {
    return this.http.get<ChamaPeriod>(`/groups/${periodId}`);
  }

  getCurrentPeriod(): Observable<ChamaPeriod | null> {
    return this.http.get<ChamaPeriod | null>('/groups/template?template=true');
  }

  getPeriodSummary(periodId: number): Observable<PeriodSummary> {
    // fineract-api: GET /runreports/PeriodSummary — Summary for a specific period
    const httpParams = new HttpParams().set('R_periodId', periodId.toString()).set('genericResultSet', 'false');
    return this.http.get<PeriodSummary>('/runreports/PeriodSummary', { params: httpParams });
  }

  openPeriod(periodId: number): Observable<ChamaPeriod> {
    return this.http.put<ChamaPeriod>(`/groups/${periodId}`, { status: 'OPEN' });
  }

  closePeriod(periodId: number): Observable<ChamaPeriod> {
    return this.http.put<ChamaPeriod>(`/groups/${periodId}`, { status: 'CLOSED' });
  }

  // ── Pool ──────────────────────────────────────────────────
  // fineract-api: GET /runreports/{reportName} — Pool status report

  getPoolStatus(periodId: number): Observable<PoolStatus> {
    const httpParams = new HttpParams().set('R_periodId', periodId.toString()).set('genericResultSet', 'false');
    return this.http.get<PoolStatus>('/runreports/PoolStatus', { params: httpParams });
  }

  // ── Contributions ─────────────────────────────────────────
  // fineract-api: GET /savings/{accountId}/transactions — List savings transactions
  // fineract-api: POST /savings/{accountId}/transactions?command=deposit — Record contribution
  // fineract-api: PUT /savings/{accountId}/transactions/{transactionId}?command=undo — Reverse

  getContributionRequirements(periodId: number): Observable<ContributionRequirement[]> {
    return this.http.get<ContributionRequirement[]>(`/groups/${periodId}/accounts`);
  }

  getMemberContributions(clientId: number): Observable<ContributionRequirement[]> {
    // fineract-api: GET /clients/{clientId}/accounts — Client savings accounts
    return this.http.get<ContributionRequirement[]>(`/clients/${clientId}/accounts`);
  }

  recordPayment(payment: PaymentRequest): Observable<ContributionPayment> {
    // fineract-api: POST /accounts/transfers — Transfer between accounts
    // For individual contributions, use savings deposit:
    // fineract-api: POST /savings/{accountId}/transactions?command=deposit
    return this.http.post<ContributionPayment>('/accounts/transfers', payment);
  }

  getPayment(paymentId: number): Observable<ContributionPayment> {
    return this.http.get<ContributionPayment>(`/accounts/transfers/${paymentId}`);
  }

  getPaymentsByPeriod(periodId: number): Observable<ContributionPayment[]> {
    return this.http.get<ContributionPayment[]>(`/accounts/transfers?fromAccountType=2&fromAccountId=${periodId}`);
  }

  reversePayment(paymentId: number, reason: string): Observable<ContributionPayment> {
    // fineract-api: POST /accounts/transfers/{transferId}?command=undo
    const httpParams = new HttpParams().set('command', 'undo');
    return this.http.put<ContributionPayment>(
      `/accounts/transfers/${paymentId}`,
      { note: reason },
      { params: httpParams }
    );
  }

  waiveContribution(contributionId: number, reason: string): Observable<ContributionRequirement> {
    // fineract-api: POST /clients/{clientId}/charges/{chargeId}?command=waive
    const httpParams = new HttpParams().set('command', 'waive');
    return this.http.put<ContributionRequirement>(
      `/clients/${contributionId}/charges/${contributionId}`,
      { note: reason },
      { params: httpParams }
    );
  }

  // ── Payouts ───────────────────────────────────────────────
  // fineract-api: GET /accounts/transfers — List transfers
  // fineract-api: POST /accounts/transfers — Create transfer (payout)
  // fineract-api: GET /standinginstructions — Standing instructions

  getPayouts(periodId?: number): Observable<Payout[]> {
    let params = new HttpParams();
    if (periodId) {
      params = params.set('fromAccountId', periodId.toString());
    }
    return this.http.get<Payout[]>('/accounts/transfers', { params });
  }

  getPayout(payoutId: number): Observable<Payout> {
    return this.http.get<Payout>(`/accounts/transfers/${payoutId}`);
  }

  initiatePayout(periodId: number): Observable<Payout> {
    // fineract-api: POST /accounts/transfers — Create a transfer (payout to recipient)
    return this.http.post<Payout>('/accounts/transfers', { fromAccountId: periodId });
  }

  approvePayout(request: PayoutApprovalRequest): Observable<Payout> {
    // fineract-api: POST /accounts/transfers/{transferId}?command=approve
    const httpParams = new HttpParams().set('command', 'approve');
    return this.http.put<Payout>(`/accounts/transfers/${request.payoutId}`, request, { params: httpParams });
  }

  executePayout(payoutId: number): Observable<Payout> {
    // fineract-api: POST /accounts/transfers/{transferId}?command=execute
    const httpParams = new HttpParams().set('command', 'execute');
    return this.http.put<Payout>(`/accounts/transfers/${payoutId}`, {}, { params: httpParams });
  }

  reversePayout(payoutId: number, reason: string): Observable<Payout> {
    // fineract-api: POST /accounts/transfers/{transferId}?command=undo
    const httpParams = new HttpParams().set('command', 'undo');
    return this.http.put<Payout>(`/accounts/transfers/${payoutId}`, { note: reason }, { params: httpParams });
  }

  // ── Reconciliation ────────────────────────────────────────
  // fineract-api: GET /audit — Retrieve audit records
  // fineract-api: GET /runreports/* — Reconciliation reports

  getReconciliationRecords(periodId: number): Observable<ReconciliationRecord[]> {
    // fineract-api: GET /runreports/ReconciliationReport
    const httpParams = new HttpParams().set('R_periodId', periodId.toString()).set('genericResultSet', 'false');
    return this.http.get<ReconciliationRecord[]>('/runreports/ReconciliationReport', { params: httpParams });
  }

  resolveReconciliation(
    recordId: number,
    resolution: { status: string; notes: string }
  ): Observable<ReconciliationRecord> {
    // fineract-api: PUT /datatables/{datatable}/{recordId}
    return this.http.put<ReconciliationRecord>(`/datatables/chama_reconciliation/${recordId}`, resolution);
  }

  // ── Audit ─────────────────────────────────────────────────
  // fineract-api: GET /audit — Search audit entries
  // fineract-api: GET /audit/{auditId} — Retrieve a single audit entry

  getAuditEvents(entityType?: string, entityId?: number, page = 0, size = 25): Observable<PagedResponse<AuditEvent>> {
    let params = new HttpParams().set('offset', page.toString()).set('limit', size.toString());
    if (entityType) {
      params = params.set('entityType', entityType);
    }
    if (entityId) {
      params = params.set('entityId', entityId.toString());
    }
    return this.http.get<PagedResponse<AuditEvent>>('/audit', { params });
  }

  // ── Governance ────────────────────────────────────────────
  // fineract-api: GET /groups/{groupId}/calendars — List calendars (meetings)
  // fineract-api: POST /groups/{groupId}/calendars — Create a calendar (meeting)
  // fineract-api: GET /groups/{groupId}/meetings/template — Meeting template
  // fineract-api: POST /groups/{groupId}/meetings — Assign attendance

  getMeetings(): Observable<GovernanceMeeting[]> {
    return this.http.get<GovernanceMeeting[]>('/groups/template?template=true');
  }

  createMeeting(meeting: Partial<GovernanceMeeting>): Observable<GovernanceMeeting> {
    return this.http.post<GovernanceMeeting>('/groups/calendars', meeting);
  }

  getMeeting(meetingId: number): Observable<GovernanceMeeting> {
    return this.http.get<GovernanceMeeting>(`/groups/${meetingId}/calendars`);
  }

  voteResolution(
    meetingId: number,
    resolutionId: number,
    vote: 'APPROVE' | 'REJECT' | 'ABSTAIN'
  ): Observable<GovernanceMeeting> {
    return this.http.put<GovernanceMeeting>(`/groups/${meetingId}/resolutions/${resolutionId}`, { vote });
  }

  // ── Offices ───────────────────────────────────────────────
  // fineract-api: GET /offices — List offices
  // fineract-api: GET /offices/template — Office template

  getOffices(): Observable<any> {
    return this.http.get('/offices');
  }

  getOfficeTemplate(): Observable<any> {
    return this.http.get('/offices/template');
  }

  // ── Standing Instructions ──────────────────────────────────
  // fineract-api: GET /standinginstructions — List standing instructions
  // fineract-api: POST /standinginstructions — Create standing instruction

  getStandingInstructions(): Observable<any> {
    return this.http.get('/standinginstructions');
  }

  createStandingInstruction(data: any): Observable<any> {
    return this.http.post('/standinginstructions', data);
  }

  // ── Savings Accounts ──────────────────────────────────────
  // fineract-api: GET /savingsaccounts — List savings accounts
  // fineract-api: POST /savingsaccounts — Create savings account
  // fineract-api: GET /savingsaccounts/{accountId} — Get savings account detail

  getSavingsAccounts(): Observable<any> {
    return this.http.get('/savingsaccounts');
  }

  getSavingsAccount(accountId: number): Observable<any> {
    return this.http.get(`/savingsaccounts/${accountId}`);
  }

  createSavingsAccount(data: any): Observable<any> {
    return this.http.post('/savingsaccounts', data);
  }

  // fineract-api: POST /savingsaccounts/{accountId}/transactions?command=deposit
  depositToSavings(accountId: number, data: any): Observable<any> {
    const httpParams = new HttpParams().set('command', 'deposit');
    return this.http.post(`/savingsaccounts/${accountId}/transactions`, data, {
      params: httpParams
    });
  }

  // fineract-api: POST /savingsaccounts/{accountId}/transactions?command=withdrawal
  withdrawFromSavings(accountId: number, data: any): Observable<any> {
    const httpParams = new HttpParams().set('command', 'withdrawal');
    return this.http.post(`/savingsaccounts/${accountId}/transactions`, data, {
      params: httpParams
    });
  }
}
