import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  imports: [ FormsModule ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  validCode = 'DEMO'
  code = '';

  ngOnInit(): void {
    this.code = localStorage.getItem('code') || '';
  }

  onCodeChange(event: any) {
    localStorage.setItem('code', event.target.value);
  }

}
