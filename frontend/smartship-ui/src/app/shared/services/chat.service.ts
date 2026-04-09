import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

/**
 * Chat Service
 * 
 * This service manages the chat widget state and will be used for future
 * backend integration with SignalR or REST APIs.
 * 
 * Future Integration Points:
 * 1. SignalR Hub Connection for real-time chat
 * 2. REST API endpoints for FAQ retrieval
 * 3. AI/ML backend for intelligent responses
 * 4. Chat history persistence
 * 5. User authentication integration
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$: Observable<ChatMessage[]> = this.messagesSubject.asObservable();

  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$: Observable<boolean> = this.isConnectedSubject.asObservable();

  constructor() {
    // TODO: Initialize SignalR connection
    // this.initializeSignalRConnection();
  }

  /**
   * Send a message to the chat backend
   * @param message - The message content to send
   * 
   * TODO: Implement backend integration
   * - Connect to .NET microservice via SignalR
   * - Send message to AI processing endpoint
   * - Handle real-time responses
   */
  sendMessage(message: string): void {
    const userMessage: ChatMessage = {
      id: this.generateId(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);

    // TODO: Send to backend
    // this.signalRHub.invoke('SendMessage', message);
    
    // Simulate bot response (remove when backend is integrated)
    this.simulateBotResponse(message);
  }

  /**
   * Get FAQ data from backend
   * 
   * TODO: Replace with actual API call
   * Example: return this.http.get<FAQ[]>('/api/chat/faqs');
   */
  getFAQs(): Observable<any[]> {
    // TODO: Implement API call to backend
    // return this.http.get<FAQ[]>(`${environment.apiUrl}/chat/faqs`);
    return new BehaviorSubject<any[]>([]).asObservable();
  }

  /**
   * Initialize SignalR connection for real-time chat
   * 
   * TODO: Implement SignalR hub connection
   * Example implementation:
   * 
   * private async initializeSignalRConnection(): Promise<void> {
   *   this.hubConnection = new HubConnectionBuilder()
   *     .withUrl(`${environment.apiUrl}/chatHub`)
   *     .withAutomaticReconnect()
   *     .build();
   * 
   *   this.hubConnection.on('ReceiveMessage', (message: ChatMessage) => {
   *     const currentMessages = this.messagesSubject.value;
   *     this.messagesSubject.next([...currentMessages, message]);
   *   });
   * 
   *   await this.hubConnection.start();
   *   this.isConnectedSubject.next(true);
   * }
   */
  private initializeSignalRConnection(): void {
    // Placeholder for SignalR initialization
    console.log('SignalR connection will be initialized here');
  }

  /**
   * Temporary method to simulate bot responses
   * Remove this when backend is integrated
   */
  private simulateBotResponse(userMessage: string): void {
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: this.generateId(),
        type: 'bot',
        content: 'Thank you for your message. Our support team will get back to you shortly.',
        timestamp: new Date()
      };

      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, botMessage]);
    }, 1000);
  }

  /**
   * Clear chat history
   */
  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Disconnect from chat backend
   * 
   * TODO: Implement proper cleanup
   */
  disconnect(): void {
    // TODO: Close SignalR connection
    // this.hubConnection?.stop();
    this.isConnectedSubject.next(false);
  }
}
