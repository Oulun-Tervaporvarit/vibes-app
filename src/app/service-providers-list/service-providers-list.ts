import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceProvider, ServiceProviderService } from '../service-provider.service';

@Component({
  selector: 'app-service-providers-list',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './service-providers-list.html',
  styleUrl: './service-providers-list.scss',
})
export class ServiceProvidersList {
  private service = inject(ServiceProviderService);

  category = input<string>();

  private allProviders = toSignal(this.service.getAll(), { initialValue: undefined });

  providers = computed(() => {
    const all = this.allProviders();
    if (all === undefined) return undefined;
    const cat = this.category();
    return cat ? all.filter((p) => p.category === cat) : all;
  });

  bannerUrl(provider: ServiceProvider): string | null {
    return this.service.bannerUrl(provider);
  }
}
