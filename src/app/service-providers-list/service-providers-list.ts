import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-service-providers-list',
  imports: [ MatCardModule, MatButtonModule, MatDividerModule ],
  templateUrl: './service-providers-list.html',
  styleUrl: './service-providers-list.scss',
})
export class ServiceProvidersList {

}
