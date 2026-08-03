import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../i18n';

@Component({
  selector: 'app-how-to-use',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './how-to-use.html',
  styleUrl: './how-to-use.scss',
})
export class HowToUse {}
