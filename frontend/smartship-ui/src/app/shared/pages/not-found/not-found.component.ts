import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './not-found.component.html',
})
export class NotFoundComponent {}
