import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ServiceProvider,
  ServiceProviderService,
  isUpcoming as providerIsUpcoming,
  opensOnLabel,
} from '../service-provider.service';
import { LanguageService, TranslatePipe } from '../i18n';

const CATEGORY_KEYS: Record<string, string> = {
  exercise: 'cat.exercise',
  culture: 'cat.culture',
  wellness: 'cat.wellness',
};

@Component({
  selector: 'app-service-providers-list',
  imports: [RouterLink, MatProgressSpinnerModule, TranslatePipe],
  templateUrl: './service-providers-list.html',
  styleUrl: './service-providers-list.scss',
})
export class ServiceProvidersList {
  private service = inject(ServiceProviderService);
  private i18n = inject(LanguageService);

  category = input<string>();

  /** When true, render a condensed text-only list instead of image cards. */
  compact = input<boolean>(false);

  private allProviders = toSignal(this.service.getAll(), { initialValue: undefined });

  providers = computed(() => {
    const all = this.allProviders();
    if (all === undefined) return undefined;
    const cat = this.category();
    const list = cat ? all.filter((p) => p.category === cat) : [...all];

    // All lists are sorted alphabetically by the displayed name (locale-aware,
    // so it re-sorts correctly when the language changes).
    const lang = this.i18n.lang();
    const sorted = [...list].sort((a, b) =>
      this.name(a).localeCompare(this.name(b), lang, { sensitivity: 'base' })
    );

    // Services that require a VIBEs code are grouped above the free ones in
    // every list; sort() is stable, so each group stays alphabetical.
    sorted.sort((a, b) => Number(a.free) - Number(b.free));

    return sorted;
  });

  bannerUrl(provider: ServiceProvider): string | null {
    return this.service.bannerUrl(provider);
  }

  /** Whether the banner is a logo — shown in full instead of cropped. */
  isLogo(provider: ServiceProvider): boolean {
    return this.service.isLogoBanner(provider);
  }

  categoryLabel(provider: ServiceProvider): string {
    const key = CATEGORY_KEYS[provider.category];
    return key ? this.i18n.t(key) : provider.category;
  }

  /** Provider name in the current language, falling back to Finnish. */
  name(provider: ServiceProvider): string {
    return this.i18n.lang() === 'en' && provider.name_en ? provider.name_en : provider.name;
  }

  /**
   * Whether the service only opens on a future date. Called from the template
   * rather than cached in a computed, so the marker corrects itself on the next
   * change-detection pass after midnight.
   */
  isUpcoming(provider: ServiceProvider): boolean {
    return providerIsUpcoming(provider);
  }

  /** The opening day of an upcoming service, e.g. `1.11.2026`. */
  opensOn(provider: ServiceProvider): string {
    return opensOnLabel(provider);
  }

  /**
   * Start offset for this card's sash animation, spread over seven steps so
   * the sashes in a grid gleam out of step. Derived from the id rather than
   * the row position: only some cards carry a sash, so counting rows would
   * hand several of them the same offset.
   */
  sashDelay(provider: ServiceProvider): string {
    return `${(provider.id % 7) * 0.6}s`;
  }
}
