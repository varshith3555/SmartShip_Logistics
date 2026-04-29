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
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss'],
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
