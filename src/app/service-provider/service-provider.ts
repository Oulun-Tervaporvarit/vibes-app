import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, switchMap } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ServiceProviderService } from '../service-provider.service';
import { VibesCodeService } from '../vibes-code.service';

const PROXIMITY_THRESHOLD_METERS = 100;

type GateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'success' }
  | { kind: 'no-code' }
  | { kind: 'redeem-failed'; reason: string };

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

/**
 * Returns true when a rich-text (HTML) value actually contains visible text.
 * Directus rich-text fields can be `null`, empty, or contain empty markup like
 * `<p></p>` or `<p><br></p>`, all of which should count as empty.
 */
function hasRichText(html: string | null | undefined): boolean {
  if (!html) return false;
  return (
    html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim().length > 0
  );
}

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
  protected vibes = inject(VibesCodeService);

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

  hasInstructions = computed(() => hasRichText(this.item()?.instructions));

  hasAddress = computed(() => !!this.item()?.address?.trim());

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
  redeemUsesLeft = signal<number | null>(null);
  // Non-blocking notice when we couldn't confirm the user is on-site.
  locationWarning = signal<string | null>(null);

  /** Whether the user currently has a stored VIBEs code. */
  hasCode = computed(() => !!this.vibes.code());

  /** Remaining uses of the current code for this provider's category. */
  categoryUsesLeft = computed(() => {
    const provider = this.item();
    if (!provider || !this.vibes.isValid()) return null;
    return this.vibes.usesLeft(provider.category);
  });

  asRedeemFailed(state: GateState): Extract<GateState, { kind: 'redeem-failed' }> {
    return state as Extract<GateState, { kind: 'redeem-failed' }>;
  }

  redeemErrorMessage(reason: string): string {
    switch (reason) {
      case 'no_uses_left':
        return 'Tällä koodilla ei ole enää käyttökertoja tässä kategoriassa.';
      case 'invalid_code':
        return 'Koodia ei löytynyt. Tarkista VIBEs-koodisi.';
      case 'free_provider':
        return 'Tämä palvelu on maksuton, lunastusta ei tarvita.';
      default:
        return 'Lunastus epäonnistui. Yritä hetken kuluttua uudelleen.';
    }
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

    // A valid VIBEs code is required to redeem.
    if (!this.vibes.code()) {
      this.gate.set({ kind: 'no-code' });
      return;
    }

    this.gate.set({ kind: 'checking' });

    // The location check is optional: it never blocks redemption, it only
    // produces a warning shown to the user when we can't confirm they're on-site.
    const warning = await this.checkLocationWarning(provider);

    const result = await this.vibes.redeem(provider.id);
    if (result.success) {
      this.redeemedAt.set(new Date());
      this.redeemUsesLeft.set(result.uses_left);
      this.locationWarning.set(warning);
      this.gate.set({ kind: 'success' });
    } else {
      this.gate.set({ kind: 'redeem-failed', reason: result.reason });
    }
  }

  /**
   * Best-effort proximity check. Returns a warning message when the user is far
   * away or their location can't be determined, or null when they're confirmed
   * to be within range. Never throws and never blocks the redemption.
   */
  private async checkLocationWarning(provider: {
    address: string;
  }): Promise<string | null> {
    let userPos: GeolocationPosition;
    try {
      userPos = await getBrowserPosition();
    } catch (err: unknown) {
      if (err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED) {
        return 'Sijainti ei ole käytössä, joten emme voineet varmistaa että olet paikan päällä. Käytä etua vain paikan päällä.';
      }
      if (err instanceof Error && err.message === 'unsupported') {
        return 'Selaimesi ei tue sijaintia, joten emme voineet varmistaa että olet paikan päällä. Käytä etua vain paikan päällä.';
      }
      return 'Sijainnin tarkistus epäonnistui, joten emme voineet varmistaa että olet paikan päällä. Käytä etua vain paikan päällä.';
    }

    let providerPos: { lat: number; lng: number } | null;
    try {
      providerPos = await firstValueFrom(this.service.geocodeAddress(provider.address));
    } catch {
      return 'Paikan sijaintia ei voitu selvittää, joten etäisyyttä ei tarkistettu.';
    }

    if (!providerPos) {
      return 'Paikan sijaintia ei löytynyt, joten etäisyyttä ei tarkistettu.';
    }

    const distance = haversineMeters(
      { lat: userPos.coords.latitude, lng: userPos.coords.longitude },
      providerPos
    );

    if (distance > PROXIMITY_THRESHOLD_METERS) {
      return `Vaikutat olevan noin ${Math.round(distance)} m päässä paikasta. Käytä etua vain paikan päällä.`;
    }

    return null;
  }
}
