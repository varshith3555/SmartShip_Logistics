import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { IdentityService } from '../../../../core/services/identity.service';
import { UserDto } from '../../../../core/models/identity.models';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <div class="sss-page">
      <h1 class="sss-title">Users</h1>
      <p class="sss-sub">Admin-only user directory.</p>

      <mat-card class="toolbar-card">
        <mat-card-content class="toolbar">
          <mat-form-field appearance="outline" class="search">
            <mat-label>Search users</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input
              matInput
              placeholder="Name or email"
              [value]="query"
              (input)="onQueryChange(($any($event.target).value || '').toString())"
            />
          </mat-form-field>
          <span class="count">{{ filtered.length }} shown</span>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content class="wrap">
          <div class="sk" *ngIf="!loaded">
            <div class="sk-row" *ngFor="let _ of [1, 2, 3, 4, 5]">
              <div class="sk-cell sk--lg"></div>
              <div class="sk-cell sk--md"></div>
              <div class="sk-cell sk--sm"></div>
              <div class="sk-cell sk--sm"></div>
            </div>
          </div>

          <table mat-table [dataSource]="filtered" class="tbl" *ngIf="loaded">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let u">{{ u.name }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let u">{{ u.email }}</td>
            </ng-container>

            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let u">
                <ng-container *ngIf="!isSelf(u); else selfRole">
                  <mat-form-field appearance="outline" class="role-field">
                    <mat-select
                      [value]="roleDraft[u.userId]"
                      (selectionChange)="roleDraft[u.userId] = $event.value"
                      [disabled]="isSaving(u)"
                      aria-label="Role"
                    >
                      <mat-option value="CUSTOMER">CUSTOMER</mat-option>
                      <mat-option value="ADMIN">ADMIN</mat-option>
                    </mat-select>
                  </mat-form-field>
                </ng-container>
                <ng-template #selfRole>
                  <span class="pill">{{ u.role }}</span>
                </ng-template>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let u">{{ u.createdAt | date : 'medium' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u" class="actions">
                <button
                  mat-flat-button
                  color="primary"
                  type="button"
                  (click)="saveRole(u)"
                  [disabled]="isSelf(u) || isSaving(u) || !isRoleChanged(u)"
                >
                  Save
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols" class="row"></tr>
          </table>

          <p class="empty" *ngIf="loaded && !filtered.length">No users match your search.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .sss-page {
        max-width: 1100px;
        margin: 0 auto;
      }
      .sss-title {
        margin: 0 0 4px;
        font-size: 1.5rem;
        font-weight: 650;
      }
      .sss-sub {
        margin: 0 0 16px;
        color: var(--ss-text-muted);
      }
      .toolbar-card {
        margin-bottom: 14px;
      }
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        padding: 8px 4px !important;
      }
      .search {
        flex: 1 1 340px;
        min-width: 260px;
      }
      .count {
        color: var(--ss-text-muted);
        font-size: 0.92rem;
      }
      .wrap {
        padding: 0 !important;
        overflow: auto;
      }
      .tbl {
        width: 100%;
      }
      .pill {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: 999px;
        background: rgba(100, 116, 139, 0.12);
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .role-field {
        width: 160px;
      }
      .actions {
        text-align: right;
        white-space: nowrap;
      }
      .row:hover {
        background: rgba(21, 101, 192, 0.04);
      }
      .empty {
        padding: 22px 16px;
        margin: 0;
        text-align: center;
        color: var(--ss-text-muted);
      }
      .sk {
        padding: 8px 0;
      }
      .sk-row {
        display: grid;
        grid-template-columns: 1.2fr 1.6fr 0.7fr 1fr;
        gap: 12px;
        align-items: center;
        padding: 14px 16px;
        border-bottom: 1px solid var(--ss-border);
      }
      .sk-cell {
        height: 12px;
        border-radius: 999px;
        background: linear-gradient(90deg, #e2e8f0, #f1f5f9, #e2e8f0);
        background-size: 200% 100%;
        animation: shimmer 1.2s ease-in-out infinite;
      }
      .sk--lg {
        width: 70%;
      }
      .sk--md {
        width: 75%;
      }
      .sk--sm {
        width: 55%;
      }
      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `,
  ],
})
export class AdminUsersComponent {
  private readonly api = inject(IdentityService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  roleDraft: Record<string, string> = {};
  private readonly saving = new Set<string>();

  users: UserDto[] = [];
  filtered: UserDto[] = [];
  cols = ['name', 'email', 'role', 'createdAt', 'actions'];
  loaded = false;
  query = '';

  constructor() {
    this.api.getUsers().subscribe({
      next: (u) => {
        const normalized = u.map((x) => ({ ...x, role: this.normalizeRole(x.role) }));
        this.users = normalized;
        this.applyFilter();
        this.roleDraft = Object.fromEntries(normalized.map((x) => [x.userId, x.role]));
        this.loaded = true;
      },
      error: () => {
        this.loaded = true;
      },
    });
  }

  onQueryChange(value: string): void {
    this.query = value;
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = (this.query ?? '').trim().toLowerCase();
    if (!q) {
      this.filtered = [...this.users];
      return;
    }
    this.filtered = this.users.filter((u) => `${u.name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q));
  }

  private normalizeRole(role: string | null | undefined): string {
    return (role ?? '').toUpperCase();
  }

  isSelf(user: UserDto): boolean {
    const me = this.auth.userId;
    return !!me && user.userId === me;
  }

  isSaving(user: UserDto): boolean {
    return this.saving.has(user.userId);
  }

  isRoleChanged(user: UserDto): boolean {
    return (this.roleDraft[user.userId] ?? user.role) !== user.role;
  }

  saveRole(user: UserDto): void {
    if (this.isSelf(user) || this.isSaving(user) || !this.isRoleChanged(user)) return;

    const nextRole = this.normalizeRole(this.roleDraft[user.userId] ?? user.role);
    const prevRole = user.role;

    this.saving.add(user.userId);
    this.api
      .assignRole(user.userId, { role: nextRole })
      .pipe(finalize(() => this.saving.delete(user.userId)))
      .subscribe({
        next: () => {
          this.users = this.users.map((u) => (u.userId === user.userId ? { ...u, role: nextRole } : u));
          this.applyFilter();
          this.roleDraft[user.userId] = nextRole;
          this.notify.success('Role updated');
        },
        error: () => {
          this.roleDraft[user.userId] = prevRole;
          this.notify.error('Failed to update role');
        },
      });
  }
}
