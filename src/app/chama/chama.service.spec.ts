/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from '@jest/globals';

import { ExitResolution } from './models/chama.enums';
import { ChamaService } from './chama.service';

describe('ChamaService', () => {
  let service: ChamaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChamaService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ChamaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── Configuration ──────────────────────────────────────────────

  it('fetches chama configuration', async () => {
    const resultPromise = firstValueFrom(service.getConfiguration());
    const req = httpMock.expectOne((r) => r.url.startsWith('/groups/template') && r.method === 'GET');
    req.flush({ name: 'Smart Women', currencyCode: 'KES' });

    expect(await resultPromise).toEqual({ name: 'Smart Women', currencyCode: 'KES' });
  });

  it('updates chama configuration via PUT to template', async () => {
    const update = { name: 'Smart Women United' };
    const resultPromise = firstValueFrom(service.updateConfiguration(update));
    const req = httpMock.expectOne((r) => r.url.startsWith('/groups/template') && r.method === 'PUT');
    expect(req.request.body).toEqual(update);
    req.flush({ name: 'Smart Women United' });

    expect(await resultPromise).toEqual({ name: 'Smart Women United' });
  });

  // ── Dashboard ──────────────────────────────────────────────────

  it('fetches dashboard summary from GroupSummaryCounts report', async () => {
    const resultPromise = firstValueFrom(service.getDashboard());

    const req = httpMock.expectOne((r) => r.url === '/runreports/GroupSummaryCounts' && r.method === 'GET');
    req.flush({ activeMembers: 12, collectedPool: 60000 });

    expect(await resultPromise).toEqual({ activeMembers: 12, collectedPool: 60000 });
  });

  // ── Members ────────────────────────────────────────────────────

  it('fetches members via /clients endpoint', async () => {
    const resultPromise = firstValueFrom(service.getMembers());

    const req = httpMock.expectOne((r) => r.url.startsWith('/clients') && r.method === 'GET');
    req.flush({ content: [{ id: 1, displayName: 'Alice' }], totalElements: 1, totalPages: 1, size: 25, number: 0 });

    const result = await resultPromise;
    expect(result.content).toEqual([{ id: 1, displayName: 'Alice' }]);
  });

  it('fetches members with status filter', async () => {
    const resultPromise = firstValueFrom(service.getMembers('ACTIVE'));
    const req = httpMock.expectOne((r) => r.url.startsWith('/clients') && r.method === 'GET');
    expect(req.request.params.get('status')).toBe('ACTIVE');
    req.flush({ content: [], totalElements: 0 });

    await resultPromise;
  });

  it('creates a new member via POST /clients', async () => {
    const member = {
      firstName: 'Alice',
      lastName: 'Mwangi',
      phoneNumber: '0712345678',
      email: 'alice@test.com',
      nationalId: 'ID-001',
      payoutAccountNumber: 'MPESA-001',
      payoutAccountBank: 'M-Pesa',
      payoutAccountName: 'Alice Mwangi'
    };
    const resultPromise = firstValueFrom(service.createMember(member));

    const req = httpMock.expectOne((r) => r.url === '/clients' && r.method === 'POST');
    expect(req.request.body).toEqual(member);
    req.flush({ id: 10, ...member });

    const resp = await resultPromise;
    expect(resp.id).toBe(10);
  });

  it('gets a single member', async () => {
    const resultPromise = firstValueFrom(service.getMember(10));

    const req = httpMock.expectOne((r) => r.url === '/clients/10' && r.method === 'GET');
    req.flush({ id: 10, firstname: 'Alice' });

    expect((await resultPromise).id).toBe(10);
  });

  it('suspends a member via PUT with command=reject', async () => {
    const resultPromise = firstValueFrom(service.suspendMember(10, 'Non-payment'));

    const req = httpMock.expectOne((r) => r.url === '/clients/10' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('reject');
    expect(req.request.body).toEqual({ rejectionNote: 'Non-payment' });
    req.flush({ status: 'SUSPENDED' });

    expect((await resultPromise).status).toBe('SUSPENDED');
  });

  it('reactivates a member via PUT with command=reactivate', async () => {
    const resultPromise = firstValueFrom(service.reactivateMember(10));

    const req = httpMock.expectOne((r) => r.url === '/clients/10' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('reactivate');
    req.flush({ status: 'ACTIVE' });

    expect((await resultPromise).status).toBe('ACTIVE');
  });

  it('exits a member via PUT with withdrawal command', async () => {
    const exitRequest = {
      memberId: 10,
      reason: 'Relocation',
      resolution: ExitResolution.DEBT_FOLLOWS
    };
    const resultPromise = firstValueFrom(service.exitMember(exitRequest));

    const req = httpMock.expectOne((r) => r.url === '/clients/10' && r.method === 'PUT');
    expect(req.request.body.command).toBe('withdraw');
    expect(req.request.body.withdrawalNote).toBe('Relocation');
    expect(req.request.body.exitResolution).toBe('DEBT_FOLLOWS');
    req.flush({ status: 'EXITED' });

    expect((await resultPromise).status).toBe('EXITED');
  });

  // ── Group Operations ───────────────────────────────────────────

  it('gets a chama group', async () => {
    const resultPromise = firstValueFrom(service.getChamaGroup('1'));

    const req = httpMock.expectOne((r) => r.url === '/groups/1' && r.method === 'GET');
    expect(req.request.params.get('associations')).toBe('all');
    req.flush({ id: 1, name: 'Smart Women' });

    expect(await resultPromise).toEqual({ id: 1, name: 'Smart Women' });
  });

  it('creates a chama group', async () => {
    const resultPromise = firstValueFrom(service.createChamaGroup({ name: 'New Group' }));

    const req = httpMock.expectOne((r) => r.url === '/groups' && r.method === 'POST');
    expect(req.request.body).toEqual({ name: 'New Group' });
    req.flush({ id: 2 });

    expect((await resultPromise).id).toBe(2);
  });

  // ── Cycles ─────────────────────────────────────────────────────

  it('fetches cycles from template endpoint', async () => {
    const resultPromise = firstValueFrom(service.getCycles());

    const req = httpMock.expectOne((r) => r.url.startsWith('/groups/template') && r.method === 'GET');
    req.flush([{ id: 1, cycleNumber: 1, status: 'ACTIVE' }]);

    expect(await resultPromise).toEqual([{ id: 1, cycleNumber: 1, status: 'ACTIVE' }]);
  });

  it('starts a new cycle via POST /groups', async () => {
    const resultPromise = firstValueFrom(service.startCycle());

    const req = httpMock.expectOne((r) => r.url === '/groups' && r.method === 'POST');
    expect(req.request.body).toEqual({ command: 'startCycle' });
    req.flush({ id: 1, status: 'ACTIVE' });

    expect((await resultPromise).status).toBe('ACTIVE');
  });

  it('completes a cycle via PUT with command=completeCycle', async () => {
    const resultPromise = firstValueFrom(service.completeCycle(1));

    const req = httpMock.expectOne((r) => r.url === '/groups/1' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('completeCycle');
    req.flush({ status: 'COMPLETED' });

    expect((await resultPromise).status).toBe('COMPLETED');
  });

  it('cancels a cycle with reason', async () => {
    const resultPromise = firstValueFrom(service.cancelCycle(1, 'Constitution amendment'));

    const req = httpMock.expectOne((r) => r.url === '/groups/1' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('cancelCycle');
    expect(req.request.body).toEqual({ reason: 'Constitution amendment' });
    req.flush({ status: 'CANCELLED' });

    expect((await resultPromise).status).toBe('CANCELLED');
  });

  // ── Rotation ───────────────────────────────────────────────────

  it('fetches rotation positions for a cycle', async () => {
    const resultPromise = firstValueFrom(service.getRotationPositions(1));

    const req = httpMock.expectOne((r) => r.url === '/groups/1' && r.method === 'GET');
    req.flush([{ position: 1, memberId: 10 }]);

    expect(await resultPromise).toEqual([{ position: 1, memberId: 10 }]);
  });

  it('sets rotation order via PUT', async () => {
    const positions = [
      { memberId: 10, position: 1 },
      { memberId: 11, position: 2 }
    ];
    const resultPromise = firstValueFrom(service.setRotationOrder(1, positions));

    const req = httpMock.expectOne((r) => r.url === '/groups/1' && r.method === 'PUT');
    expect(req.request.body.positions).toEqual(positions);
    req.flush(positions.map((p) => ({ ...p, id: p.memberId })));

    const result = await resultPromise;
    expect(result.length).toBe(2);
  });

  it('swaps two rotation positions', async () => {
    const resultPromise = firstValueFrom(service.swapPositions(1, 10, 11, 5));

    const req = httpMock.expectOne((r) => r.url === '/groups/1/swap-positions' && r.method === 'PUT');
    expect(req.request.body).toEqual({
      memberAId: 10,
      memberBId: 11,
      governanceResolutionId: 5
    });
    req.flush([
      { position: 1, memberId: 11 },
      { position: 2, memberId: 10 }
    ]);

    const result = await resultPromise;
    expect(result.length).toBe(2);
  });

  // ── Periods ────────────────────────────────────────────────────

  it('fetches periods from groups template', async () => {
    const resultPromise = firstValueFrom(service.getPeriods());

    const req = httpMock.expectOne((r) => r.url.startsWith('/groups/template') && r.method === 'GET');
    req.flush([{ id: 1, periodNumber: 1, status: 'OPEN' }]);

    expect(await resultPromise).toEqual([{ id: 1, periodNumber: 1, status: 'OPEN' }]);
  });

  it('opens a period via PUT', async () => {
    const resultPromise = firstValueFrom(service.openPeriod(1));

    const req = httpMock.expectOne((r) => r.url === '/groups/1' && r.method === 'PUT');
    expect(req.request.body).toEqual({ status: 'OPEN' });
    req.flush({ status: 'OPEN' });

    expect((await resultPromise).status).toBe('OPEN');
  });

  it('closes a period via PUT', async () => {
    const resultPromise = firstValueFrom(service.closePeriod(1));

    const req = httpMock.expectOne((r) => r.url === '/groups/1' && r.method === 'PUT');
    expect(req.request.body).toEqual({ status: 'CLOSED' });
    req.flush({ status: 'CLOSED' });

    expect((await resultPromise).status).toBe('CLOSED');
  });

  it('closes a period with explicit reason for shortfall authorization', async () => {
    const resultPromise = firstValueFrom(service.closePeriodWithReason(1, 'SHORTFALL_AUTHORIZED', 'Board approved'));

    const req = httpMock.expectOne((r) => r.url === '/groups/1' && r.method === 'PUT');
    expect(req.request.body).toEqual({
      status: 'CLOSED',
      closureReason: 'SHORTFALL_AUTHORIZED',
      authorizationNote: 'Board approved'
    });
    req.flush({ status: 'CLOSED' });

    expect((await resultPromise).status).toBe('CLOSED');
  });

  // ── Pool ───────────────────────────────────────────────────────

  it('gets pool status for a period', async () => {
    const resultPromise = firstValueFrom(service.getPoolStatus(1));

    const req = httpMock.expectOne((r) => r.url === '/runreports/PoolStatus' && r.method === 'GET');
    expect(req.request.params.get('R_periodId')).toBe('1');
    req.flush({
      expectedPool: 60000,
      collectedPool: 55000,
      outstandingPool: 5000
    });

    const pool = await resultPromise;
    expect(pool.expectedPool).toBe(60000);
    expect(pool.outstandingPool).toBe(5000);
  });

  // ── Contributions ──────────────────────────────────────────────

  it('fetches contribution requirements for a period', async () => {
    const resultPromise = firstValueFrom(service.getContributionRequirements(1));

    const req = httpMock.expectOne((r) => r.url === '/groups/1/accounts' && r.method === 'GET');
    req.flush([{ memberId: 10, amountDue: 5000, outstanding: 0 }]);

    expect(await resultPromise).toEqual([
      { memberId: 10, amountDue: 5000, outstanding: 0 }
    ]);
  });

  it('records a payment via POST /accounts/transfers', async () => {
    const payment = {
      periodId: 1,
      memberId: 10,
      amount: 5000,
      paymentMethod: 'MOBILE',
      providerTransactionId: 'MPESA-12345',
      reference: 'MPESA Ref',
      notes: 'Monthly contribution'
    };
    const resultPromise = firstValueFrom(service.recordPayment(payment));

    const req = httpMock.expectOne((r) => r.url === '/accounts/transfers' && r.method === 'POST');
    expect(req.request.body.providerTransactionId).toBe('MPESA-12345');
    req.flush({ id: 100, status: 'CONFIRMED' });

    expect((await resultPromise).status).toBe('CONFIRMED');
  });

  it('applies credit to a period', async () => {
    const resultPromise = firstValueFrom(service.applyCreditToPeriod(10, 1));

    const req = httpMock.expectOne((r) => r.url === '/clients/10/apply-credit' && r.method === 'POST');
    expect(req.request.body).toEqual({ periodId: 1 });
    req.flush({ success: true });

    expect(await resultPromise).toEqual({ success: true });
  });

  it('fetches member credit balance', async () => {
    const resultPromise = firstValueFrom(service.getMemberCreditBalance(10));

    const req = httpMock.expectOne((r) => r.url === '/clients/10/credit-balance' && r.method === 'GET');
    req.flush({ creditBalance: 3000 });

    expect((await resultPromise).creditBalance).toBe(3000);
  });

  // ── Payouts ────────────────────────────────────────────────────

  it('fetches payouts from accounts/transfers', async () => {
    const resultPromise = firstValueFrom(service.getPayouts());

    const req = httpMock.expectOne((r) => r.url === '/accounts/transfers' && r.method === 'GET');
    req.flush([{ id: 1, amount: 60000 }]);

    expect(await resultPromise).toEqual([{ id: 1, amount: 60000 }]);
  });

  it('initiates a payout via POST /accounts/transfers', async () => {
    const resultPromise = firstValueFrom(service.initiatePayout(1));

    const req = httpMock.expectOne((r) => r.url === '/accounts/transfers' && r.method === 'POST');
    expect(req.request.body).toEqual({ fromAccountId: 1 });
    req.flush({ id: 1, status: 'READY' });

    expect((await resultPromise).status).toBe('READY');
  });

  it('approves a payout via PUT with command=approve', async () => {
    const resultPromise = firstValueFrom(
      service.approvePayout({ payoutId: 1, approved: true, notes: 'Treasurer approval' })
    );

    const req = httpMock.expectOne((r) => r.url === '/accounts/transfers/1' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('approve');
    expect(req.request.body).toEqual({ payoutId: 1, approved: true, notes: 'Treasurer approval' });
    req.flush({ status: 'APPROVED' });

    expect((await resultPromise).status).toBe('APPROVED');
  });

  it('executes a payout via PUT with command=execute', async () => {
    const resultPromise = firstValueFrom(service.executePayout(1));

    const req = httpMock.expectOne((r) => r.url === '/accounts/transfers/1' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('execute');
    req.flush({ status: 'COMPLETED' });

    expect((await resultPromise).status).toBe('COMPLETED');
  });

  it('reverses a payout via PUT with command=undo', async () => {
    const resultPromise = firstValueFrom(service.reversePayout(1, 'Incorrect amount'));

    const req = httpMock.expectOne((r) => r.url === '/accounts/transfers/1' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('undo');
    expect(req.request.body).toEqual({ note: 'Incorrect amount' });
    req.flush({ status: 'REVERSED' });

    expect((await resultPromise).status).toBe('REVERSED');
  });

  // ── Reconciliation ─────────────────────────────────────────────

  it('fetches reconciliation records via report', async () => {
    const resultPromise = firstValueFrom(service.getReconciliationRecords(1));

    const req = httpMock.expectOne((r) => r.url === '/runreports/ReconciliationReport' && r.method === 'GET');
    expect(req.request.params.get('R_periodId')).toBe('1');
    req.flush([{ id: 1, status: 'MATCHED' }]);

    expect(await resultPromise).toEqual([{ id: 1, status: 'MATCHED' }]);
  });

  it('resolves a reconciliation discrepancy via PUT', async () => {
    const resultPromise = firstValueFrom(service.resolveReconciliation(1, { status: 'MATCHED', notes: 'Verified' }));

    const req = httpMock.expectOne((r) => r.url === '/datatables/chama_reconciliation/1' && r.method === 'PUT');
    expect(req.request.body.status).toBe('MATCHED');
    expect(req.request.body.notes).toBe('Verified');
    req.flush({ status: 'MATCHED' });

    expect((await resultPromise).status).toBe('MATCHED');
  });

  // ── Audit ──────────────────────────────────────────────────────

  it('fetches audit events with optional filters', async () => {
    const resultPromise = firstValueFrom(service.getAuditEvents('MEMBER', 10));

    const req = httpMock.expectOne((r) => r.url === '/audit' && r.method === 'GET');
    expect(req.request.params.get('entityType')).toBe('MEMBER');
    expect(req.request.params.get('entityId')).toBe('10');
    req.flush({ content: [{ action: 'MEMBER_CREATED' }], totalElements: 1 });

    const result = await resultPromise;
    expect(result.content).toEqual([{ action: 'MEMBER_CREATED' }]);
  });

  it('fetches audit events without filters', async () => {
    const resultPromise = firstValueFrom(service.getAuditEvents());

    const req = httpMock.expectOne((r) => r.url === '/audit' && r.method === 'GET');
    req.flush({ content: [], totalElements: 0 });

    expect((await resultPromise).content).toEqual([]);
  });

  // ── Meetings ───────────────────────────────────────────────────

  it('fetches meetings from group calendars', async () => {
    const resultPromise = firstValueFrom(service.getMeetings());

    const req = httpMock.expectOne((r) => r.url === '/groups/calendars' && r.method === 'GET');
    req.flush([{ id: 1, title: 'Monthly Meeting' }]);

    expect(await resultPromise).toEqual([{ id: 1, title: 'Monthly Meeting' }]);
  });

  it('schedules a meeting', async () => {
    const meeting = { title: 'February Meeting', meetingDate: '2026-02-15' };
    const resultPromise = firstValueFrom(service.scheduleMeeting(meeting));

    const req = httpMock.expectOne((r) => r.url === '/groups/calendars' && r.method === 'POST');
    expect(req.request.body).toEqual(meeting);
    req.flush({ id: 2, title: 'February Meeting' });

    expect((await resultPromise).id).toBe(2);
  });

  it('starts a meeting via PUT with command=start', async () => {
    const resultPromise = firstValueFrom(service.startMeeting(2));

    const req = httpMock.expectOne((r) => r.url === '/groups/calendars/2' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('start');
    expect(req.request.body.status).toBe('IN_PROGRESS');
    req.flush({ status: 'IN_PROGRESS' });

    expect((await resultPromise).status).toBe('IN_PROGRESS');
  });

  it('completes a meeting via PUT with command=complete', async () => {
    const resultPromise = firstValueFrom(service.completeMeeting(2));

    const req = httpMock.expectOne((r) => r.url === '/groups/calendars/2' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('complete');
    req.flush({ status: 'COMPLETED' });

    expect((await resultPromise).status).toBe('COMPLETED');
  });

  it('cancels a meeting via PUT with command=cancel', async () => {
    const resultPromise = firstValueFrom(service.cancelMeeting(2, 'Rescheduled'));

    const req = httpMock.expectOne((r) => r.url === '/groups/calendars/2' && r.method === 'PUT');
    expect(req.request.params.get('command')).toBe('cancel');
    expect(req.request.body.reason).toBe('Rescheduled');
    req.flush({ status: 'CANCELLED' });

    expect((await resultPromise).status).toBe('CANCELLED');
  });

  it('records attendance for a meeting', async () => {
    const request = {
      meetingId: 2,
      attendance: [
        { memberId: 10, attended: true },
        { memberId: 11, attended: false, absenceReason: 'Sick' }
      ]
    };
    const resultPromise = firstValueFrom(service.recordAttendance(request));

    const req = httpMock.expectOne((r) => r.url === '/groups/calendars/2/attendance' && r.method === 'POST');
    expect(req.request.body).toEqual(request.attendance);
    req.flush([
      { memberId: 10 },
      { memberId: 11 }
    ]);

    expect((await resultPromise).length).toBe(2);
  });

  // ── Governance ─────────────────────────────────────────────────

  it('votes on a resolution', async () => {
    const resultPromise = firstValueFrom(service.voteResolution(2, 5, 'APPROVE'));

    const req = httpMock.expectOne((r) => r.url === '/groups/2/resolutions/5' && r.method === 'PUT');
    expect(req.request.body).toEqual({ vote: 'APPROVE' });
    req.flush({ id: 5 });

    expect(await resultPromise).toEqual({ id: 5 });
  });

  // ── Social Fund ────────────────────────────────────────────────

  it('fetches social fund balance', async () => {
    const resultPromise = firstValueFrom(service.getSocialFund());

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_social_fund' && r.method === 'GET');
    req.flush({ balance: 25000, totalContributions: 100000 });

    const fund = await resultPromise;
    expect(fund.balance).toBe(25000);
  });

  it('records a social fund contribution', async () => {
    const contribution = {
      memberId: 10,
      memberName: 'Alice Mwangi',
      amount: 1000,
      paymentDate: '2026-02-15',
      providerTransactionId: 'SF-001',
      periodId: 1
    };
    const resultPromise = firstValueFrom(service.recordSocialFundContribution(contribution));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_social_fund/contributions' && r.method === 'POST');
    expect(req.request.body.memberId).toBe(10);
    req.flush({ id: 1, ...contribution });

    expect((await resultPromise).id).toBe(1);
  });

  it('requests a social fund disbursement', async () => {
    const request = {
      memberId: 11,
      purpose: 'FUNERAL' as any,
      amount: 5000,
      description: 'Member bereavement'
    };
    const resultPromise = firstValueFrom(service.requestSocialFundDisbursement(request));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_social_fund/disbursements' && r.method === 'POST');
    expect(req.request.body.purpose).toBe('FUNERAL');
    req.flush({ id: 1, status: 'PENDING_APPROVAL' });

    expect((await resultPromise).status).toBe('PENDING_APPROVAL');
  });

  it('approves or rejects a social fund disbursement', async () => {
    const resultPromise = firstValueFrom(service.approveSocialFundDisbursement(1, true));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_social_fund/disbursements/1' && r.method === 'PUT');
    expect(req.request.body.approved).toBe(true);
    req.flush({ status: 'APPROVED' });

    expect((await resultPromise).status).toBe('APPROVED');
  });

  // ── Member Roles ───────────────────────────────────────────────

  it('assigns a role to a member', async () => {
    const request = { memberId: 10, role: 'TREASURER' as any, assignedBy: 1 };
    const resultPromise = firstValueFrom(service.assignRole(request));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_member_role' && r.method === 'POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 1, ...request });

    expect((await resultPromise).role).toBe('TREASURER');
  });

  it('removes a role from a member', async () => {
    const resultPromise = firstValueFrom(service.removeRole(10));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_member_role/10' && r.method === 'DELETE');
    req.flush({ success: true });

    expect(await resultPromise).toEqual({ success: true });
  });

  // ── Fines ──────────────────────────────────────────────────────

  it('fetches all fines', async () => {
    const resultPromise = firstValueFrom(service.getFines());

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_fine' && r.method === 'GET');
    req.flush([{ id: 1, amount: 500, paid: false }]);

    expect(await resultPromise).toEqual([{ id: 1, amount: 500, paid: false }]);
  });
  it('imposes a fine on a member', async () => {
    const request = {
      memberId: 11,
      reason: 'Late attendance',
      amount: 500
    };
    const resultPromise = firstValueFrom(service.imposeFine(request));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_fine' && r.method === 'POST');
    expect(req.request.body.amount).toBe(500);
    req.flush({ id: 1, paid: false });

    expect((await resultPromise).paid).toBe(false);
  });

  it('pays a fine via PUT', async () => {
    const resultPromise = firstValueFrom(service.payFine(1, 'CASH', 'CASH-002'));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_fine/1' && r.method === 'PUT');
    expect(req.request.body.paid).toBe(true);
    expect(req.request.body.paymentMethod).toBe('CASH');
    req.flush({ paid: true });

    expect((await resultPromise).paid).toBe(true);
  });

  it('waives a fine with reason', async () => {
    const resultPromise = firstValueFrom(service.waiveFine(1, 'Medical emergency'));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_fine/1' && r.method === 'PUT');
    expect(req.request.body.waived).toBe(true);
    expect(req.request.body.reason).toBe('Medical emergency');
    req.flush({ paid: false });

    expect((await resultPromise).paid).toBe(false);
  });

  // ── Loans & Voting ─────────────────────────────────────────────

  it('submits a loan request', async () => {
    const request = {
      memberId: 10,
      memberName: 'Alice Mwangi',
      loanAmount: 20000,
      purpose: 'Business expansion',
      repaymentPeriodMonths: 3,
      proposedMonthlyRepayment: 6667,
      collateralDescription: 'None'
    };
    const resultPromise = firstValueFrom(service.submitLoanRequest(request));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_loan_request' && r.method === 'POST');
    expect(req.request.body.loanAmount).toBe(20000);
    req.flush({ id: 1, status: 'PENDING_VOTE' });

    expect((await resultPromise).status).toBe('PENDING_VOTE');
  });

  it('casts a vote on a loan request', async () => {
    const request = { loanRequestId: 1, result: 'APPROVED' as any, notes: 'Good business plan' };
    const resultPromise = firstValueFrom(service.castVote(request));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_loan_vote' && r.method === 'POST');
    expect(req.request.body.result).toBe('APPROVED');
    req.flush({ id: 1 });

    expect(await resultPromise).toEqual({ id: 1 });
  });

  it('gets vote tally with typed response', async () => {
    const resultPromise = firstValueFrom(service.getVoteTally(1));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_loan_vote/1/tally' && r.method === 'GET');
    req.flush({
      votesFor: 8,
      votesAgainst: 2,
      votesAbstain: 1,
      isApproved: true
    });

    const tally = await resultPromise;
    expect(tally.votesFor).toBe(8);
    expect(tally.isApproved).toBe(true);
  });

  // ── Share-out ──────────────────────────────────────────────────

  it('calculates share-out for a cycle', async () => {
    const resultPromise = firstValueFrom(service.calculateShareOut(1));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_share_out/1/calculate' && r.method === 'POST');
    req.flush({ totalSurplus: 60000, perMemberShare: 5000 });

    const result = await resultPromise;
    expect(result.perMemberShare).toBe(5000);
  });

  it('distributes share-out to members', async () => {
    const resultPromise = firstValueFrom(service.distributeShareOut(1));

    const req = httpMock.expectOne((r) => r.url === '/datatables/dt_share_out/1/distribute' && r.method === 'POST');
    req.flush({ distributedAt: '2026-02-01T10:00:00Z' });

    expect((await resultPromise).distributedAt).toBeDefined();
  });

  // ── Offices & Standing Instructions ────────────────────────────

  it('fetches offices', async () => {
    const resultPromise = firstValueFrom(service.getOffices());

    const req = httpMock.expectOne((r) => r.url === '/offices' && r.method === 'GET');
    req.flush([{ id: 1, name: 'Head Office' }]);

    expect(await resultPromise).toEqual([{ id: 1, name: 'Head Office' }]);
  });

  it('creates a standing instruction', async () => {
    const data = { amount: 5000, frequency: 'MONTHLY', accountId: 1 };
    const resultPromise = firstValueFrom(service.createStandingInstruction(data));

    const req = httpMock.expectOne((r) => r.url === '/standinginstructions' && r.method === 'POST');
    expect(req.request.body).toEqual(data);
    req.flush({ id: 1 });

    expect(await resultPromise).toEqual({ id: 1 });
  });
});
