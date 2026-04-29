import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { LandingNavbarComponent } from '../../components/navbar/landing-navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    LandingNavbarComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  features: Array<{
    icon: string;
    title: string;
    description: string;
    imageSrc: string;
    fallbackImageSrc: string;
    imageAlt: string;
  }> = [
      {
        icon: 'flight',
        title: 'Air Freight Excellence',
        description: 'Global air cargo solutions with priority handling and expedited customs clearance.',
        imageSrc: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
        fallbackImageSrc: '/assets/images/home/why/secure.svg',
        imageAlt: 'Cargo plane on runway',
      },
      {
        icon: 'local_shipping',
        title: 'Ground Transportation',
        description: 'Reliable fleet management with real-time GPS tracking and optimized delivery routes.',
        imageSrc: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80',
        fallbackImageSrc: '/assets/images/home/why/fast.svg',
        imageAlt: 'Logistics trucks in motion',
      },
      {
        icon: 'inventory_2',
        title: 'Container Shipping',
        description: 'Seamless ocean freight with full container load and consolidated shipment options.',
        imageSrc: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=800&q=80',
        fallbackImageSrc: '/assets/images/home/why/tracking.svg',
        imageAlt: 'Shipping containers at port',
      },
      {
        icon: 'warehouse',
        title: 'Warehouse Operations',
        description: 'Advanced inventory management with automated sorting and climate-controlled storage.',
        imageSrc: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
        fallbackImageSrc: '/assets/images/home/why/global.svg',
        imageAlt: 'Modern warehouse facility',
      },
      {
        icon: 'analytics',
        title: 'Smart Analytics',
        description: 'AI-powered insights for demand forecasting and supply chain optimization.',
        imageSrc: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        fallbackImageSrc: '/assets/images/home/why/ai.svg',
        imageAlt: 'Logistics analytics dashboard',
      },
      {
        icon: 'support_agent',
        title: 'Dedicated Support',
        description: '24/7 expert assistance with multilingual support and dedicated account managers.',
        imageSrc: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80',
        fallbackImageSrc: '/assets/images/home/why/support.svg',
        imageAlt: 'Customer support team',
      },
    ];

  constructor(private router: Router) { }

  onFeatureImageError(event: Event, feature: { fallbackImageSrc: string }): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    if (img.src.endsWith(feature.fallbackImageSrc)) return;
    img.src = feature.fallbackImageSrc;
  }

  navigateToSignup(): void {
    this.router.navigate(['/auth/signup']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
