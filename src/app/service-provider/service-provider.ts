import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, switchMap } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceProviderService } from '../service-provider.service';

const PROXIMITY_THRESHOLD_METERS = 100;

type GateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'success' }
  | { kind: 'too-far'; distance: number }
  | { kind: 'denied' }
  | { kind: 'unsupported' }
  | { kind: 'not-found' }
  | { kind: 'error' };

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  });
}

const CATEGORY_LABEL: Record<string, string> = {
  exercise: 'Liikunta',
  culture: 'Kulttuuri',
  wellness: 'Hyvinvointi',
};

@Component({
  selector: 'app-service-provider',
  imports: [DatePipe, MatProgressSpinnerModule],
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

  gate = signal<GateState>({ kind: 'idle' });
  redeemedAt = signal<Date | null>(null);

  asTooFar(state: GateState): Extract<GateState, { kind: 'too-far' }> {
    return state as Extract<GateState, { kind: 'too-far' }>;
  }

  constructor(protected location: Location) {}

  goBack() {
    this.location.back();
  }

  dismissGate() {
    this.gate.set({ kind: 'idle' });
  }

  async onShowToStaff() {
    const provider = this.item();
    if (!provider) return;
    if (this.gate().kind === 'checking') return;

    this.gate.set({ kind: 'checking' });

    let userPos: GeolocationPosition;
    try {
      userPos = await getBrowserPosition();
    } catch (err: unknown) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          this.gate.set({ kind: 'denied' });
          return;
        }
      } else if (err instanceof Error && err.message === 'unsupported') {
        this.gate.set({ kind: 'unsupported' });
        return;
      }
      this.gate.set({ kind: 'error' });
      return;
    }

    let providerPos: { lat: number; lng: number } | null;
    try {
      providerPos = await firstValueFrom(this.service.geocodeAddress(provider.address));
    } catch {
      this.gate.set({ kind: 'error' });
      return;
    }

    if (!providerPos) {
      this.gate.set({ kind: 'not-found' });
      return;
    }

    const distance = haversineMeters(
      { lat: userPos.coords.latitude, lng: userPos.coords.longitude },
      providerPos
    );

    if (distance <= PROXIMITY_THRESHOLD_METERS) {
      this.redeemedAt.set(new Date());
      this.gate.set({ kind: 'success' });
    } else {
      this.gate.set({ kind: 'too-far', distance: Math.round(distance) });
    }
  }
}
