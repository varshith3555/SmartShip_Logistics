import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './access-denied.component.html',
})
export class AccessDeniedComponent {}
