import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { ServiceProvidersList } from "../service-providers-list/service-providers-list";
import { TranslatePipe } from '../i18n';

/**
 * Tab order must match the `<mat-tab>` order in the template. The key is stored
 * in the URL (`?tab=…`) so that returning from a service detail page (via the
 * browser back / the detail "back" button) reopens the same tab instead of
 * always falling back to the first one.
 */
const TAB_KEYS = ['exercise', 'culture', 'wellness', 'all'] as const;

@Component({
  selector: 'app-service-provider-tabs',
  imports: [MatTabsModule, MatButtonModule, ServiceProvidersList, RouterLink, TranslatePipe],
  templateUrl: './service-provider-tabs.html',
  styleUrl: './service-provider-tabs.scss',
})
export class ServiceProviderTabs {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /** Active tab index, restored from `?tab=` on load (defaults to the first). */
  protected selectedIndex = this.indexFromUrl();

  private indexFromUrl(): number {
    const key = this.route.snapshot.queryParamMap.get('tab');
    const i = key ? TAB_KEYS.indexOf(key as (typeof TAB_KEYS)[number]) : -1;
    return i >= 0 ? i : 0;
  }

  /**
   * Persist the active tab in the URL. `replaceUrl` keeps a single history entry
   * for the tab view, so pressing back from a detail page lands right back on
   * this tab. The first tab is stored as no param to keep the home URL clean.
   */
  onTabChange(index: number): void {
    // Ignore the initial/no-op event so it can't wipe a restored `?tab=`.
    if (index === this.selectedIndex) return;
    this.selectedIndex = index;
    const tab = index > 0 ? TAB_KEYS[index] : null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: tab ? { tab } : {},
      replaceUrl: true,
    });
  }
}
