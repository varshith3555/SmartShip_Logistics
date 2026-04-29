import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  // Local dev: keep relative so `ng serve --proxy-config proxy.conf.json` forwards to the gateway.
  factory: () => '',
});
