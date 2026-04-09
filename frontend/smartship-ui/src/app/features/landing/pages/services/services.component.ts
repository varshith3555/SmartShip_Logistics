import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { LandingNavbarComponent } from '../../components/navbar/landing-navbar.component';

type ServiceTab = {
  id: 'b2c' | 'b2b' | 'international' | '3pl';
  title: string;
  icon: string;
  imageSrc: string;
  fallbackImageSrc: string;
  imageAlt: string;
  description: string;
  features: string[];
  benefits: string[];
};

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, MatIconModule, LandingNavbarComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class ServicesComponent {
  activeServiceId: ServiceTab['id'] = 'b2c';

  readonly serviceTabs: ServiceTab[] = [
    {
      id: 'b2c',
      title: 'B2C Logistics',
      icon: 'smartphone',
      imageSrc: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
      fallbackImageSrc: '/assets/images/service-b2c.svg',
      imageAlt: 'Mobile tracking and last-mile delivery experience',
      description:
        'Seamless last-mile delivery with real-time mobile tracking and exceptional customer experience at every touchpoint.',
      features: [
        'Mobile-first tracking experience',
        'Smart delivery notifications',
        'Flexible delivery windows',
        'Automated returns processing',
      ],
      benefits: [
        'Enhanced customer satisfaction',
        'Reduced delivery exceptions',
        'Real-time visibility for end users',
      ],
    },
    {
      id: 'b2b',
      title: 'B2B Logistics',
      icon: 'business_center',
      imageSrc: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
      fallbackImageSrc: '/assets/images/service-b2b.svg',
      imageAlt: 'Business workflow and warehouse automation',
      description:
        'Enterprise-grade bulk operations with automated workflows, warehouse integration, and predictable service levels.',
      features: [
        'Bulk shipment orchestration',
        'Warehouse management integration',
        'SLA-driven operations',
        'Advanced reporting dashboards',
      ],
      benefits: [
        'Streamlined business processes',
        'Cost optimization through consolidation',
        'Improved operational efficiency',
      ],
    },
    {
      id: 'international',
      title: 'International Logistics',
      icon: 'language',
      imageSrc: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80',
      fallbackImageSrc: '/assets/images/service-international.svg',
      imageAlt: 'Global routes and cross-border logistics network',
      description:
        'Global shipping network with intelligent routing, automated customs documentation, and end-to-end visibility across borders.',
      features: [
        'Multi-carrier global network',
        'Automated customs compliance',
        'Cross-border route optimization',
        'International milestone tracking',
      ],
      benefits: [
        'Faster customs clearance',
        'Reduced international delays',
        'Complete global transparency',
      ],
    },
    {
      id: '3pl',
      title: '3rd Party Logistics (3PL)',
      icon: 'dashboard',
      imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      fallbackImageSrc: '/assets/images/service-3pl.svg',
      imageAlt: 'Supply chain dashboard and automation platform',
      description:
        'Integrated 3PL platform with real-time dashboards, automated fulfillment workflows, and complete supply chain visibility.',
      features: [
        'Unified fulfillment dashboard',
        'Automated inventory sync',
        'Multi-warehouse orchestration',
        'Performance analytics & SLAs',
      ],
      benefits: [
        'Scalable operations without overhead',
        'Data-driven decision making',
        'Consistent fulfillment performance',
      ],
    },
  ];

  constructor(private router: Router) {}

  get activeService(): ServiceTab {
    return this.serviceTabs.find(tab => tab.id === this.activeServiceId) ?? this.serviceTabs[0];
  }

  setActiveService(id: ServiceTab['id']): void {
    this.activeServiceId = id;
  }

  onDetailImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    const fallback = this.activeService.fallbackImageSrc;
    if (img.src.endsWith(fallback)) return;
    img.src = fallback;
  }

  getStarted(): void {
    this.router.navigate(['/auth/signup']);
  }
}
