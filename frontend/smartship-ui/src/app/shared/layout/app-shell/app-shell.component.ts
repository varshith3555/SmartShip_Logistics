import { AsyncPipe, NgClass, NgIf, UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    AsyncPipe,
    UpperCasePipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpoint = inject(BreakpointObserver);

  readonly isHandset$ = this.breakpoint.observe('(max-width: 959px)').pipe(map((r) => r.matches));

  collapsed = false;

  get role(): string | null {
    return this.auth.role;
  }

  get email(): string {
    return String(this.auth.getCurrentUser()?.email ?? '').trim();
  }

  get displayName(): string {
    return String(this.auth.getCurrentUser()?.name ?? '').trim();
  }

  get isAdmin(): boolean {
    return (this.auth.role ?? '').toUpperCase() === 'ADMIN';
  }

  get isCustomer(): boolean {
    return (this.auth.role ?? '').toUpperCase() === 'CUSTOMER';
  }

  get isCustomerOrAdmin(): boolean {
    const r = (this.auth.role ?? '').toUpperCase();
    return r === 'CUSTOMER' || r === 'ADMIN';
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
  }

  closeOnMobile(drawer: MatSidenav): void {
    if (!this.breakpoint.isMatched('(max-width: 959px)')) return;
    void drawer.close();
  }

  onLogout(): void {
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
