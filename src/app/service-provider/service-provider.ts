import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, switchMap } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FeedbackRating, ServiceProviderService } from '../service-provider.service';
import { VibesCodeService } from '../vibes-code.service';
import { LanguageService, TranslatePipe } from '../i18n';
import { ExternalLinksDirective } from '../external-links.directive';

const PROXIMITY_THRESHOLD_METERS = 100;

/** A translatable message: a dictionary key plus optional interpolation params. */
interface LocalizedMessage {
  key: string;
  params?: Record<string, string | number>;
}

type GateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'success' }
  | { kind: 'no-code' }
  | { kind: 'confirm' }
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

const CATEGORY_KEYS: Record<string, string> = {
  exercise: 'cat.exercise',
  culture: 'cat.culture',
  wellness: 'cat.wellness',
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

/**
 * Extracts an 11-character YouTube video id from a bare id or from any of the
 * common URL forms (watch?v=, youtu.be/, /embed/, /shorts/, /live/). Returns
 * null when nothing usable is found.
 */
function youtubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');
  let candidate: string | null = null;
  if (host === 'youtu.be') {
    candidate = url.pathname.slice(1);
  } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    candidate = url.searchParams.get('v');
    if (!candidate) {
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'embed' || p === 'shorts' || p === 'live');
      if (idx >= 0) candidate = parts[idx + 1] ?? null;
    }
  }

  return candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

@Component({
  selector: 'app-service-provider',
  imports: [DatePipe, MatProgressSpinnerModule, TranslatePipe, ExternalLinksDirective],
  templateUrl: './service-provider.html',
  styleUrl: './service-provider.scss',
})
export class ServiceProvider {
  private route = inject(ActivatedRoute);
  private service = inject(ServiceProviderService);
  private sanitizer = inject(DomSanitizer);
  protected vibes = inject(VibesCodeService);
  protected i18n = inject(LanguageService);

  item = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.service.getById(params.get('id')!))),
    { initialValue: undefined }
  );

  bannerSrc = computed(() => {
    const provider = this.item();
    return provider ? this.service.bannerUrl(provider) : null;
  });

  /** Whether the banner is a logo — shown in full instead of cropped. */
  bannerIsLogo = computed(() => {
    const provider = this.item();
    return !!provider && this.service.isLogoBanner(provider);
  });

  categoryLabel = computed(() => {
    const provider = this.item();
    if (!provider) return '';
    const key = CATEGORY_KEYS[provider.category];
    return key ? this.i18n.t(key) : provider.category;
  });

  /** Provider fields in the current language, falling back to Finnish. */
  localizedName = computed(() => {
    const p = this.item();
    if (!p) return '';
    return this.i18n.lang() === 'en' && p.name_en ? p.name_en : p.name;
  });

  localizedDescription = computed(() => {
    const p = this.item();
    if (!p) return '';
    return this.i18n.lang() === 'en' && p.description_en ? p.description_en : p.description;
  });

  localizedInstructions = computed(() => {
    const p = this.item();
    if (!p) return '';
    return this.i18n.lang() === 'en' && p.instructions_en
      ? p.instructions_en
      : p.instructions ?? '';
  });

  hasInstructions = computed(() => hasRichText(this.localizedInstructions()));

  hasAddress = computed(() => !!this.item()?.address?.trim());

  videoSrc = computed<SafeResourceUrl | null>(() => {
    const id = youtubeId(this.item()?.instruction_video);
    if (!id) return null;
    const url = `https://www.youtube-nocookie.com/embed/${id}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
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
  redeemUsesLeft = signal<number | null>(null);
  // Non-blocking notice when we couldn't confirm the user is on-site.
  locationWarning = signal<LocalizedMessage | null>(null);

  // Thumbs up/down feedback state for free services.
  feedbackRating = signal<FeedbackRating | null>(null);
  feedbackSending = signal(false);
  feedbackError = signal(false);

  /** Whether the user currently has a stored VIBEs code. */
  hasCode = computed(() => !!this.vibes.code());

  /** Remaining uses of the current code (shared across all categories). */
  usesLeft = computed(() => {
    if (!this.vibes.isValid()) return null;
    return this.vibes.usesLeft();
  });

  /** Whether the current code has already redeemed this (non-free) service. */
  alreadyRedeemed = computed(() => {
    const provider = this.item();
    if (!provider || provider.free) return false;
    return this.vibes.hasRedeemed(provider.id);
  });

  asRedeemFailed(state: GateState): Extract<GateState, { kind: 'redeem-failed' }> {
    return state as Extract<GateState, { kind: 'redeem-failed' }>;
  }

  redeemErrorMessage(reason: string): string {
    const known = ['already_used', 'no_uses_left', 'invalid_code', 'free_provider'];
    return this.i18n.t(known.includes(reason) ? `reason.${reason}` : 'reason.generic');
  }

  constructor(protected location: Location) {
    // Remember an already-given rating (per provider) across reloads.
    effect(() => {
      const provider = this.item();
      if (!provider) return;
      const stored = this.readFeedback(provider.id);
      this.feedbackRating.set(stored);
      this.feedbackError.set(false);
    });
  }

  private feedbackKey(id: number): string {
    return `feedback_${id}`;
  }

  private readFeedback(id: number): FeedbackRating | null {
    try {
      const v = localStorage.getItem(this.feedbackKey(id));
      return v === 'up' || v === 'down' ? v : null;
    } catch {
      return null;
    }
  }

  async submitFeedback(rating: FeedbackRating) {
    const provider = this.item();
    if (!provider) return;
    if (this.feedbackSending() || this.feedbackRating()) return;

    this.feedbackSending.set(true);
    this.feedbackError.set(false);
    const ok = await this.service.submitFeedback(provider.id, rating);
    this.feedbackSending.set(false);

    if (ok) {
      this.feedbackRating.set(rating);
      try {
        localStorage.setItem(this.feedbackKey(provider.id), rating);
      } catch {
        /* storage may be unavailable — feedback still counts server-side */
      }
    } else {
      this.feedbackError.set(true);
    }
  }

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

    // The location check is optional: it never blocks redemption. If we can't
    // confirm the user is on-site, ask them to confirm before spending a use.
    const warning = await this.checkLocationWarning(provider);
    this.locationWarning.set(warning);

    if (warning) {
      this.gate.set({ kind: 'confirm' });
      return;
    }

    await this.doRedeem(provider);
  }

  /** Called when the user accepts the off-site confirmation dialog. */
  async confirmRedeem() {
    const provider = this.item();
    if (!provider) return;
    if (this.gate().kind !== 'confirm') return;
    this.gate.set({ kind: 'checking' });
    await this.doRedeem(provider);
  }

  /** Performs the actual redemption. Keeps any location warning for the receipt. */
  private async doRedeem(provider: { id: number }) {
    const result = await this.vibes.redeem(provider.id);
    if (result.success) {
      this.redeemedAt.set(new Date());
      this.redeemUsesLeft.set(result.uses_left);
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
  }): Promise<LocalizedMessage | null> {
    let userPos: GeolocationPosition;
    try {
      userPos = await getBrowserPosition();
    } catch (err: unknown) {
      if (err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED) {
        return { key: 'loc.denied' };
      }
      if (err instanceof Error && err.message === 'unsupported') {
        return { key: 'loc.unsupported' };
      }
      return { key: 'loc.error' };
    }

    let providerPos: { lat: number; lng: number } | null;
    try {
      providerPos = await firstValueFrom(this.service.geocodeAddress(provider.address));
    } catch {
      return { key: 'loc.geocode_fail' };
    }

    if (!providerPos) {
      return { key: 'loc.not_found' };
    }

    const distance = haversineMeters(
      { lat: userPos.coords.latitude, lng: userPos.coords.longitude },
      providerPos
    );

    if (distance > PROXIMITY_THRESHOLD_METERS) {
      return { key: 'loc.too_far', params: { distance: Math.round(distance) } };
    }

    return null;
  }
}
