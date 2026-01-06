import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from "@angular/forms";
import {MatIconModule} from '@angular/material/icon';
import { Location } from '@angular/common';

const MOCK_DATA =   {
    title: "Shiba Inu #1",
    subtitle: "Terapiakoira",
    image: "https://material.angular.dev/assets/img/examples/shiba2.jpg",
    description: `The Shiba Inu is the smallest of the six original and distinct spitz breeds of dog from Japan.
                A small, agile dog that copes very well with mountainous terrain, the Shiba Inu was originally
                bred for hunting.`
};

@Component({
  selector: 'app-service-provider',
  imports: [MatCardModule, MatButtonModule, MatDividerModule, FormsModule, MatIconModule],
  templateUrl: './service-provider.html',
  styleUrl: './service-provider.scss',
})
export class ServiceProvider {
  item = MOCK_DATA;

  constructor(protected location: Location) {}
}
