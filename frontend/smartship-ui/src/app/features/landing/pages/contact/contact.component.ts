import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LandingNavbarComponent } from '../../components/navbar/landing-navbar.component';
import { ChatWidgetComponent } from '../../../../shared/components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    LandingNavbarComponent,
    ChatWidgetComponent
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  contactInfo = [
    {
      icon: 'email',
      title: 'Email',
      value: 'support@smartship.com',
      link: 'mailto:support@smartship.com'
    },
    {
      icon: 'phone',
      title: 'Phone',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567'
    },
    {
      icon: 'location_on',
      title: 'Address',
      value: '123 Logistics Ave, Suite 100, New York, NY 10001',
      link: null
    }
  ];
}
