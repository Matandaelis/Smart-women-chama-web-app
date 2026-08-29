/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../shared/material.module';
import { ChamaDashboard } from './models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'mifosx-chama',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    TranslateModule
  ],
  templateUrl: './chama.component.html',
  styleUrls: ['./chama.component.scss']
})
export class ChamaComponent implements OnInit {
  private route = inject(ActivatedRoute);

  dashboard!: ChamaDashboard;

  ngOnInit(): void {
    this.dashboard = this.route.snapshot.data['dashboard'];
  }
}
