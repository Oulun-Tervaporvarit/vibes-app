import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceProviderService } from '../service-provider.service';

const CATEGORY_LABEL: Record<string, string> = {
  exercise: 'Liikunta',
  culture: 'Kulttuuri',
  wellness: 'Hyvinvointi',
};

@Component({
  selector: 'app-service-provider',
  imports: [MatProgressSpinnerModule],
  templateUrl: './service-provider.html',
  styleUrl: './service-provider.scss',
})
export class ServiceProvider {
  private route = inject(ActivatedRoute);
  private service = inject(ServiceProviderService);
  private sanitizer = inject(DomSanitizer);

  item = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.service.getById(params.get('id')!))),
    { initialValue: undefined }
  );

  bannerSrc = computed(() => {
    const provider = this.item();
    return provider ? this.service.bannerUrl(provider) : null;
  });

  categoryLabel = computed(() => {
    const provider = this.item();
    return provider ? CATEGORY_LABEL[provider.category] ?? provider.category : '';
  });

  mapSrc = computed<SafeResourceUrl | null>(() => {
    const addr = this.item()?.address;
    if (!addr) return null;
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&hl=fi&z=15&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  mapLinkUrl = computed<string | null>(() => {
    const addr = this.item()?.address;
    if (!addr) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  });

  constructor(protected location: Location) {}

  goBack() {
    this.location.back();
  }
}
