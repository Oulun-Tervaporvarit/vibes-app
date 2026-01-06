import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from "@angular/forms";
import { RouterLink } from '@angular/router';
import {MatIconModule} from '@angular/material/icon';


const MOCK_PROVIDERS = [
  {
    title: "Shiba Inu #1",
    subtitle: "Terapiakoira",
    image: "https://material.angular.dev/assets/img/examples/shiba2.jpg",
    description: `The Shiba Inu is the smallest of the six original and distinct spitz breeds of dog from Japan.
                A small, agile dog that copes very well with mountainous terrain, the Shiba Inu was originally
                bred for hunting.`
  },
  {
    title: "Shiba Inu #2",
    subtitle: "Terapiakoira",
    image: "https://material.angular.dev/assets/img/examples/shiba2.jpg",
    description: `The Shiba Inu is the smallest of the six original and distinct spitz breeds of dog from Japan.
                A small, agile dog that copes very well with mountainous terrain, the Shiba Inu was originally
                bred for hunting.`
  },
  {
    title: "Shiba Inu #3",
    subtitle: "Terapiakoira",
    image: "https://material.angular.dev/assets/img/examples/shiba2.jpg",
    description: `The Shiba Inu is the smallest of the six original and distinct spitz breeds of dog from Japan.
                A small, agile dog that copes very well with mountainous terrain, the Shiba Inu was originally
                bred for hunting.`
  },
  {
    title: "Shiba Inu #4",
    subtitle: "Terapiakoira",
    image: "https://material.angular.dev/assets/img/examples/shiba2.jpg",
    description: `The Shiba Inu is the smallest of the six original and distinct spitz breeds of dog from Japan.
                A small, agile dog that copes very well with mountainous terrain, the Shiba Inu was originally
                bred for hunting.`
  },
  {
    title: "Shiba Inu #5",
    subtitle: "Terapiakoira",
    image: "https://material.angular.dev/assets/img/examples/shiba2.jpg",
    description: `The Shiba Inu is the smallest of the six original and distinct spitz breeds of dog from Japan.
                A small, agile dog that copes very well with mountainous terrain, the Shiba Inu was originally
                bred for hunting.`
  }
]

@Component({
  selector: 'app-service-providers-list',
  imports: [MatCardModule, MatButtonModule, MatDividerModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './service-providers-list.html',
  styleUrl: './service-providers-list.scss',
})
export class ServiceProvidersList {

  providers = MOCK_PROVIDERS;

}
