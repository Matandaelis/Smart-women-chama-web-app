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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/shared/material.module';
import { ChamaMeeting, MeetingAttendance } from '../models';
import { MeetingStatus } from '../models/chama.enums';
import { ChamaService } from '../chama.service';

@Component({
  selector: 'mifosx-chama-meetings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatExpansionModule,
    MatCheckboxModule,
    TranslateModule
  ],
  templateUrl: './chama-meetings.component.html',
  styleUrls: ['./chama-meetings.component.scss']
})
export class ChamaMeetingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private chamaService = inject(ChamaService);

  meetings: ChamaMeeting[] = [];
  selectedMeeting: ChamaMeeting | null = null;
  attendance: MeetingAttendance[] = [];
  scheduleForm!: FormGroup;
  showScheduleForm = false;
  MeetingStatus = MeetingStatus;
  displayedColumns = [
    'meetingNumber',
    'date',
    'venue',
    'status',
    'attendees',
    'collected',
    'actions'
  ];

  ngOnInit(): void {
    this.meetings = this.route.snapshot.data['meetings'] || [];
    this.initScheduleForm();
  }

  private initScheduleForm(): void {
    this.scheduleForm = this.fb.group({
      meetingDate: [
        '',
        Validators.required
      ],
      venue: [
        '',
        Validators.required
      ],
      agenda: ['']
    });
  }

  toggleScheduleForm(): void {
    this.showScheduleForm = !this.showScheduleForm;
  }

  scheduleMeeting(): void {
    if (this.scheduleForm.valid) {
      this.chamaService.scheduleMeeting(this.scheduleForm.value).subscribe(() => {
        this.showScheduleForm = false;
        this.scheduleForm.reset();
      });
    }
  }

  startMeeting(meeting: ChamaMeeting): void {
    this.chamaService.startMeeting(meeting.id).subscribe();
  }

  completeMeeting(meeting: ChamaMeeting): void {
    if (confirm('Complete this meeting and finalize attendance?')) {
      this.chamaService.completeMeeting(meeting.id).subscribe();
    }
  }

  viewAttendance(meeting: ChamaMeeting): void {
    this.selectedMeeting = meeting;
    this.chamaService.getMeetingAttendance(meeting.id).subscribe({
      next: (data) => {
        this.attendance = data;
      }
    });
  }

  getStatusColor(status: MeetingStatus): string {
    switch (status) {
      case MeetingStatus.COMPLETED:
        return 'primary';
      case MeetingStatus.IN_PROGRESS:
        return 'accent';
      case MeetingStatus.CANCELLED:
        return 'warn';
      default:
        return '';
    }
  }

  getAttendanceRate(meeting: ChamaMeeting): number {
    return meeting.attendeesCount > 0 ? meeting.attendeesCount : 0;
  }
}
