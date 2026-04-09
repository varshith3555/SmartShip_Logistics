import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LandingNavbarComponent } from '../../components/navbar/landing-navbar.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    LandingNavbarComponent
  ],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  values = [
    {
      icon: 'verified',
      title: 'Reliability',
      description: 'We ensure your packages reach their destination safely and on time.'
    },
    {
      icon: 'speed',
      title: 'Efficiency',
      description: 'Streamlined processes for faster delivery and better service.'
    },
    {
      icon: 'favorite',
      title: 'Customer First',
      description: 'Your satisfaction is our top priority in everything we do.'
    },
    {
      icon: 'eco',
      title: 'Sustainability',
      description: 'Committed to eco-friendly practices in our operations.'
    }
  ];
}
