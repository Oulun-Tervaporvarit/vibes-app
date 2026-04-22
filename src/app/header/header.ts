import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [ FormsModule, RouterLink ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  validCode = 'DEMO'
  code = '';

  benefits = [
    { category: 'culture', label: 'Kulttuuri', icon: 'theater_comedy', count: 3 },
    { category: 'wellness', label: 'Hyvinvointi', icon: 'spa', count: 3 },
  ];

  ngOnInit(): void {
    this.code = localStorage.getItem('code') || '';
  }

  onCodeChange(event: any) {
    localStorage.setItem('code', event.target.value);
  }

  clearCode() {
    this.code = '';
    localStorage.removeItem('code');
  }

}
