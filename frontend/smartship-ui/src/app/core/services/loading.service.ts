import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private activeRequests = 0;
  private readonly _loading$ = new BehaviorSubject<boolean>(false);

  readonly loading$ = this._loading$.asObservable();

  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) this._loading$.next(true);
  }

  hide(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) this._loading$.next(false);
  }

  reset(): void {
    this.activeRequests = 0;
    this._loading$.next(false);
  }
}
