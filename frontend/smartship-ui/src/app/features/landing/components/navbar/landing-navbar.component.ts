import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './landing-navbar.component.html',
  styleUrls: ['./landing-navbar.component.scss']
})
export class LandingNavbarComponent implements OnInit {
  isLoggedIn = false;
  userName = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isLoggedIn = isAuth;
      if (isAuth) {
        const user = this.authService.getCurrentUser();
        this.userName = user?.name || user?.email || 'User';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
