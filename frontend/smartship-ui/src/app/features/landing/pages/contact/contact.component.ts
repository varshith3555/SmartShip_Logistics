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
      value: 'varshith1220@gmail.com',
      link: 'mailto:varshith1220@gmail.com'
    },
    {
      icon: 'phone',
      title: 'Phone',
      value: '7893837321',
      link: 'tel:7893837321'
    },
    {
      icon: 'location_on',
      title: 'Address',
      value: 'LPU, Delhi - G.T Road, Punjab',
      link: null
    }
  ];
}
