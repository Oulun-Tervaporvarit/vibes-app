import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceProvider, ServiceProviderService } from '../service-provider.service';

const CATEGORY_LABEL: Record<string, string> = {
  exercise: 'Liikunta',
  culture: 'Kulttuuri',
  wellness: 'Hyvinvointi',
};

@Component({
  selector: 'app-service-providers-list',
  imports: [RouterLink, MatProgressSpinnerModule],
  templateUrl: './service-providers-list.html',
  styleUrl: './service-providers-list.scss',
})
export class ServiceProvidersList {
  private service = inject(ServiceProviderService);

  category = input<string>();

  /** When true, render a condensed text-only list instead of image cards. */
  compact = input<boolean>(false);

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

  categoryLabel(provider: ServiceProvider): string {
    return CATEGORY_LABEL[provider.category] ?? provider.category;
  }
}
