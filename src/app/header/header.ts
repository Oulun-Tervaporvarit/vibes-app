import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VibesCodeService } from '../vibes-code.service';

@Component({
  selector: 'app-header',
  imports: [FormsModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private vibes = inject(VibesCodeService);

  /** Bound to the input field; committed to the service on submit. */
  code = '';

  valid = computed(() => this.vibes.isValid());
  activeCode = computed(() => this.vibes.code());
  checking = computed(() => this.vibes.checking());
  // True once we've checked a non-empty code and it turned out invalid.
  invalid = computed(() => {
    const b = this.vibes.balance();
    return !!this.vibes.code() && b !== null && b.valid === false;
  });

  // Total visits left, shared across all categories.
  uses = computed(() => this.vibes.balance()?.uses ?? 0);

  ngOnInit(): void {
    this.code = this.vibes.code();
  }

  submitCode(): void {
    this.vibes.setCode(this.code);
  }

  clearCode(): void {
    this.code = '';
    this.vibes.clearCode();
  }
}
