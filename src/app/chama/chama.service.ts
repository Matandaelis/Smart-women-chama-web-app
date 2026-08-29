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
  MemberExitRequest,
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
 * Business Logic Rules:
 *
 *   1. ONE ACTIVE CYCLE MAXIMUM
 *      - A new cycle cannot start until the current one completes or is cancelled
 *      - getCycles() returns all cycles; getActiveCycle() returns the single active one
 *      - startCycle() will fail if an active cycle exists (enforced server-side)
 *
 *   2. ONE POSITION PER MEMBER PER CYCLE
 *      - Each member occupies exactly one position in the rotation order
 *      - Position N maps to Period N, whose recipient is the member at Position N
 *      - setRotationOrder() validates no duplicate positions or members
 *
 *   3. PERIOD CANNOT CLOSE SOLELY BECAUSE DATE PASSED
 *      - closePeriod() requires: all contributions resolved, payout completed,
 *        reconciliation done, no critical discrepancies
 *      - period.canClose is computed server-side based on these conditions
 *      - Use closePeriodWithReason() when closing a period with shortfall/issues
 *
 *   4. MEMBER EXIT HANDLING
 *      - Exiting members remain in historical records
 *      - Their future position is NOT automatically reassigned
 *      - exitMember() accepts a resolution policy:
 *        * DEBT_FOLLOWS: Member still owes remaining periods after exit
 *        * FORFEIT_PAID: Member's paid contributions become forfeited
 *        * REPLACED: Replacement member takes over remaining obligations
 *        * BUYOUT: Member pays a buy-out amount for remaining periods
 *
 *   5. OVERPAYMENT HANDLING
 *      - If payment > amountDue, the excess is tracked separately
 *      - Default action is CREDIT (applied to future periods)
 *      - Overpayment never silently increases contribution amount
 *      - RecordPayment() accepts an explicit overpaymentAction parameter
 *
 *   6. SUSPENSION
 *      - Suspended members retain their position in rotation
 *      - Their contribution requirement becomes OVERDUE
 *      - Payout to them shows SHORTFALL until reactivation or admin resolution
 *
 *   7. SHORTFALL HANDLING
 *      - Period goes to SHORTFALL if collected pool < expected pool
 *      - Do NOT make partial payouts unless allowPartialPayout is configured
 *      - Shortfall periods require explicit admin authorization to close
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

  activateChama(groupId: string): Observable<any> {
    const httpParams = new HttpParams().set('command', 'activate');
    return this.http.post(`/groups/${groupId}`, {}, { params: httpParams });
  }

  // ── Dashboard ─────────────────────────────────────────────
  // fineract-api: GET /runreports/{reportName} — Dashboard summary reports

  getDashboard(): Observable<ChamaDashboard> {
    return this.http.get<ChamaDashboard>('/runreports/GroupSummaryCounts');
  }

  // ── Members (Clients) ─────────────────────────────────────
  // fineract-api: GET /clients — List all clients
  // fineract-api: POST /clients — Create a new client
  // fineract-api: GET /clients/{clientId} — Retrieve client detail
  // fineract-api: PUT /clients/{clientId} — Update client

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
    return this.http.post<ChamaMember>('/clients', member);
  }

  updateMember(clientId: number, member: Partial<ChamaMember>): Observable<ChamaMember> {
    return this.http.put<ChamaMember>(`/clients/${clientId}`, member);
  }

  changeMemberStatus(request: MemberStatusChangeRequest): Observable<ChamaMember> {
    return this.http.put<ChamaMember>(`/clients/${request.memberId}`, request);
  }

  /** Exit member with explicit resolution policy */
  exitMember(request: MemberExitRequest): Observable<ChamaMember> {
    return this.http.put<ChamaMember>(`/clients/${request.memberId}`, {
      command: 'withdraw',
      withdrawalNote: request.reason,
      exitResolution: request.resolution,
      replacementMemberId: request.replacementMemberId,
      buyoutPayment: request.buyoutPayment
    });
  }

  suspendMember(clientId: number, reason: string): Observable<ChamaMember> {
    const httpParams = new HttpParams().set('command', 'reject');
    return this.http.put<ChamaMember>(`/clients/${clientId}`, { rejectionNote: reason }, { params: httpParams });
  }

  reactivateMember(clientId: number): Observable<ChamaMember> {
    const httpParams = new HttpParams().set('command', 'reactivate');
    return this.http.put<ChamaMember>(`/clients/${clientId}`, {}, { params: httpParams });
  }

  getGroupMembers(groupId: string): Observable<any> {
    return this.http.get(`/groups/${groupId}/clients`);
  }

  addClientToGroup(groupId: string, clientId: number): Observable<any> {
    return this.http.post(`/groups/${groupId}/clients`, { clientId });
  }

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

  /**
   * Start a new cycle.
   * ENFORCEMENT: Server rejects if an active cycle already exists.
   * Returns 409 Conflict if a cycle is already active.
   */
  startCycle(): Observable<ChamaCycle> {
    return this.http.post<ChamaCycle>('/groups', { command: 'startCycle' });
  }

  /** Complete a cycle (called automatically when all periods are closed) */
  completeCycle(cycleId: number): Observable<ChamaCycle> {
    const httpParams = new HttpParams().set('command', 'completeCycle');
    return this.http.put<ChamaCycle>(`/groups/${cycleId}`, {}, { params: httpParams });
  }

  /** Cancel a cycle (requires admin authorization) */
  cancelCycle(cycleId: number, reason: string): Observable<ChamaCycle> {
    const httpParams = new HttpParams().set('command', 'cancelCycle');
    return this.http.put<ChamaCycle>(`/groups/${cycleId}`, { reason }, { params: httpParams });
  }

  // ── Rotation Positions ────────────────────────────────────
  // fineract-api: PUT /datatables/{datatable}/{groupId}
  // Custom datatable: chama_rotation_positions

  getRotationPositions(cycleId: number): Observable<RotationPosition[]> {
    return this.http.get<RotationPosition[]>(`/groups/${cycleId}`);
  }

  /** Set rotation order. Server validates: no duplicate members, no duplicate positions. */
  setRotationOrder(
    cycleId: number,
    positions: { memberId: number; position: number }[]
  ): Observable<RotationPosition[]> {
    return this.http.put<RotationPosition[]>(`/groups/${cycleId}`, { positions });
  }

  /** Swap two members' rotation positions. Requires both members' consent (governance). */
  swapPositions(
    cycleId: number,
    memberAId: number,
    memberBId: number,
    governanceResolutionId: number
  ): Observable<RotationPosition[]> {
    return this.http.put<RotationPosition[]>(`/groups/${cycleId}/swap-positions`, {
      memberAId,
      memberBId,
      governanceResolutionId
    });
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
    const httpParams = new HttpParams().set('R_periodId', periodId.toString()).set('genericResultSet', 'false');
    return this.http.get<PeriodSummary>('/runreports/PeriodSummary', { params: httpParams });
  }

  openPeriod(periodId: number): Observable<ChamaPeriod> {
    return this.http.put<ChamaPeriod>(`/groups/${periodId}`, { status: 'OPEN' });
  }

  closePeriod(periodId: number): Observable<ChamaPeriod> {
    return this.http.put<ChamaPeriod>(`/groups/${periodId}`, { status: 'CLOSED' });
  }

  /** Close period with a reason (required for SHORTFALL, MEMBER_DEFAULT, etc.) */
  closePeriodWithReason(periodId: number, closureReason: string, authorizationNote: string): Observable<ChamaPeriod> {
    return this.http.put<ChamaPeriod>(`/groups/${periodId}`, {
      status: 'CLOSED',
      closureReason,
      authorizationNote
    });
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
    return this.http.get<ContributionRequirement[]>(`/clients/${clientId}/accounts`);
  }

  /**
   * Record a payment. Handles overpayment according to policy:
   * - If overpaymentAction is provided, uses that
   * - Otherwise falls back to configuration default (CREDIT)
   * - Overpayment never silently increases contribution amount
   */
  recordPayment(payment: PaymentRequest): Observable<ContributionPayment> {
    return this.http.post<ContributionPayment>('/accounts/transfers', payment);
  }

  getPayment(paymentId: number): Observable<ContributionPayment> {
    return this.http.get<ContributionPayment>(`/accounts/transfers/${paymentId}`);
  }

  getPaymentsByPeriod(periodId: number): Observable<ContributionPayment[]> {
    return this.http.get<ContributionPayment[]>(`/accounts/transfers?fromAccountType=2&fromAccountId=${periodId}`);
  }

  reversePayment(paymentId: number, reason: string): Observable<ContributionPayment> {
    const httpParams = new HttpParams().set('command', 'undo');
    return this.http.put<ContributionPayment>(
      `/accounts/transfers/${paymentId}`,
      { note: reason },
      { params: httpParams }
    );
  }

  waiveContribution(contributionId: number, reason: string): Observable<ContributionRequirement> {
    const httpParams = new HttpParams().set('command', 'waive');
    return this.http.put<ContributionRequirement>(
      `/clients/${contributionId}/charges/${contributionId}`,
      { note: reason },
      { params: httpParams }
    );
  }

  /** Apply a member's credit balance to a specific period's contribution */
  applyCreditToPeriod(memberId: number, periodId: number): Observable<ContributionRequirement> {
    return this.http.post<ContributionRequirement>(`/clients/${memberId}/apply-credit`, { periodId });
  }

  /** Get a member's current credit balance from overpayments */
  getMemberCreditBalance(memberId: number): Observable<{ creditBalance: number }> {
    return this.http.get<{ creditBalance: number }>(`/clients/${memberId}/credit-balance`);
  }

  // ── Payouts ───────────────────────────────────────────────
  // fineract-api: GET /accounts/transfers — List transfers
  // fineract-api: POST /accounts/transfers — Create transfer (payout)

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
    return this.http.post<Payout>('/accounts/transfers', { fromAccountId: periodId });
  }

  approvePayout(request: PayoutApprovalRequest): Observable<Payout> {
    const httpParams = new HttpParams().set('command', 'approve');
    return this.http.put<Payout>(`/accounts/transfers/${request.payoutId}`, request, { params: httpParams });
  }

  executePayout(payoutId: number): Observable<Payout> {
    const httpParams = new HttpParams().set('command', 'execute');
    return this.http.put<Payout>(`/accounts/transfers/${payoutId}`, {}, { params: httpParams });
  }

  reversePayout(payoutId: number, reason: string): Observable<Payout> {
    const httpParams = new HttpParams().set('command', 'undo');
    return this.http.put<Payout>(`/accounts/transfers/${payoutId}`, { note: reason }, { params: httpParams });
  }

  // ── Reconciliation ────────────────────────────────────────
  // fineract-api: GET /runreports/* — Reconciliation reports

  getReconciliationRecords(periodId: number): Observable<ReconciliationRecord[]> {
    const httpParams = new HttpParams().set('R_periodId', periodId.toString()).set('genericResultSet', 'false');
    return this.http.get<ReconciliationRecord[]>('/runreports/ReconciliationReport', {
      params: httpParams
    });
  }

  resolveReconciliation(
    recordId: number,
    resolution: { status: string; notes: string }
  ): Observable<ReconciliationRecord> {
    return this.http.put<ReconciliationRecord>(`/datatables/chama_reconciliation/${recordId}`, resolution);
  }

  // ── Audit ─────────────────────────────────────────────────
  // fineract-api: GET /audit — Search audit entries

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

  getOffices(): Observable<any> {
    return this.http.get('/offices');
  }

  getOfficeTemplate(): Observable<any> {
    return this.http.get('/offices/template');
  }

  // ── Standing Instructions ──────────────────────────────────
  // fineract-api: GET /standinginstructions — List standing instructions

  getStandingInstructions(): Observable<any> {
    return this.http.get('/standinginstructions');
  }

  createStandingInstruction(data: any): Observable<any> {
    return this.http.post('/standinginstructions', data);
  }

  // ── Savings Accounts ──────────────────────────────────────
  // fineract-api: GET /savingsaccounts — List savings accounts

  getSavingsAccounts(): Observable<any> {
    return this.http.get('/savingsaccounts');
  }

  getSavingsAccount(accountId: number): Observable<any> {
    return this.http.get(`/savingsaccounts/${accountId}`);
  }

  createSavingsAccount(data: any): Observable<any> {
    return this.http.post('/savingsaccounts', data);
  }

  depositToSavings(accountId: number, data: any): Observable<any> {
    const httpParams = new HttpParams().set('command', 'deposit');
    return this.http.post(`/savingsaccounts/${accountId}/transactions`, data, {
      params: httpParams
    });
  }

  withdrawFromSavings(accountId: number, data: any): Observable<any> {
    const httpParams = new HttpParams().set('command', 'withdrawal');
    return this.http.post(`/savingsaccounts/${accountId}/transactions`, data, {
      params: httpParams
    });
  }
}
