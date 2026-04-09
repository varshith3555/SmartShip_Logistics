import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  icon?: string;
}

interface ChatMessage {
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss'],
  animations: [
    trigger('chatWindow', [
      state('closed', style({
        opacity: 0,
        transform: 'translateY(20px) scale(0.95)',
        visibility: 'hidden'
      })),
      state('open', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        visibility: 'visible'
      })),
      transition('closed => open', [
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)')
      ]),
      transition('open => closed', [
        animate('200ms cubic-bezier(0.4, 0, 1, 1)')
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ChatWidgetComponent implements AfterViewChecked {
  @ViewChild('chatBody') private chatBody!: ElementRef;
  
  isOpen = false;
  chatMessages: ChatMessage[] = [];
  isTyping = false;
  hasUnreadMessages = false;
  private shouldScrollToBottom = false;

  faqs: FAQ[] = [
    {
      id: 1,
      question: 'Where is my shipment?',
      answer: 'You can track your shipment in real-time by entering your tracking number on our Track Shipment page. You\'ll see the current location, estimated delivery time, and complete shipping history.',
      icon: 'local_shipping'
    },
    {
      id: 2,
      question: 'How to track my order?',
      answer: 'To track your order: 1) Go to the Track Shipment page, 2) Enter your tracking number (found in your confirmation email), 3) Click "Track" to view real-time updates. You can also save tracking numbers for quick access.',
      icon: 'search'
    },
    {
      id: 3,
      question: 'Contact support',
      answer: 'Our support team is available 24/7! Email us at support@smartship.com, call +1 (555) 123-4567, or visit our Contact page. We typically respond within 2 hours during business hours.',
      icon: 'support_agent'
    },
    {
      id: 4,
      question: 'What are your shipping rates?',
      answer: 'Shipping rates vary based on package size, weight, destination, and delivery speed. Use our Rate Calculator on the home page for instant quotes. We offer competitive rates with multiple carrier options.',
      icon: 'payments'
    },
    {
      id: 5,
      question: 'How long does delivery take?',
      answer: 'Delivery times depend on your chosen service: Express (1-2 days), Standard (3-5 days), or Economy (5-7 days). International shipments may take 7-14 days. Track your package for accurate estimates.',
      icon: 'schedule'
    }
  ];

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      // Reset state when closing
      setTimeout(() => {
        this.chatMessages = [];
        this.isTyping = false;
      }, 200);
    } else {
      // Mark messages as read when opening
      this.hasUnreadMessages = false;
    }
  }

  selectFAQ(faq: FAQ): void {
    // Add question to chat
    this.chatMessages.push({
      type: 'question',
      content: faq.question,
      timestamp: new Date()
    });

    this.shouldScrollToBottom = true;

    // Show typing indicator
    this.isTyping = true;

    // Simulate typing delay and add answer
    setTimeout(() => {
      this.isTyping = false;
      this.chatMessages.push({
        type: 'answer',
        content: faq.answer,
        timestamp: new Date()
      });
      this.shouldScrollToBottom = true;
    }, 1000);
  }

  private scrollToBottom(): void {
    try {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  // Placeholder for future backend integration
  sendCustomMessage(message: string): void {
    // TODO: Integrate with SignalR or REST API
    console.log('Message to be sent to backend:', message);
  }
}
