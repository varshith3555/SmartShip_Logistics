import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client.service';

export interface ReportIssueRequest {
  shipmentId: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class SupportService {
  constructor(private readonly api: ApiClient) {}

  reportIssue(request: ReportIssueRequest): Observable<void> {
    return this.api.post<void>('/gateway/support/issues', request);
  }
}
