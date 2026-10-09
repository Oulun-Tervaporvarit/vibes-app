import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, map, of } from 'rxjs';

const CMS_BASE_URL = 'https://cms.allvibes.fi';

/**
 * Public webhook flow that records thumbs up/down feedback for a service in the
 * (private) `service_feedback` collection. Called with GET + query params so the
 * browser skips the CORS preflight (see VibesCodeService for the rationale).
 */
const FEEDBACK_FLOW = '380e6bb7-0edd-4845-9753-5a2f2c06114b';

export type FeedbackRating = 'up' | 'down';

export type ServiceProviderCategory = 'exercise' | 'culture' | 'wellness';

export interface DirectusFile {
  id: string;
  filename_download?: string;
  title?: string;
  type?: string;
  width?: number | null;
  height?: number | null;
}

/** Junction row of the `images` files field on `service_provider`. */
export interface ServiceProviderImage {
  directus_files_id: DirectusFile | null;
}

export interface ServiceProvider {
  id: number;
  status: string;
  name: string;
  name_en?: string | null;
  category: ServiceProviderCategory | string;
  free: boolean;
  /**
   * First day the service can be used, as a Directus date-only string
   * (`YYYY-MM-DD`). Empty/null means the service is always open. Read it
   * through `isUpcoming()` / `opensOnLabel()` below — never `new Date(...)`.
   */
  opens_on?: string | null;
  description: string;
  description_en?: string | null;
  instructions: string;
  instructions_en?: string | null;
  instruction_video?: string | null;
  address: string;
  banner: DirectusFile | null;
  images?: ServiceProviderImage[] | null;
}

/** Today as a local-calendar `YYYY-MM-DD` string. The argument exists for tests. */
export function todayIsoDate(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** True when `value` looks like a Directus date-only string we can work with. */
function isIsoDate(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}/.test(value.trim());
}

/**
 * True when the service has not opened yet.
 *
 * An empty `opens_on` means the service is always open, and the opening day
 * itself counts as open, so the comparison is a strict `>`.
 *
 * `opens_on` is compared as a *string*, never parsed into a `Date`:
 * `new Date('2026-11-01')` is UTC midnight, which then renders (and compares)
 * as the previous day in any negative-offset timezone. ISO-8601 dates sort
 * lexicographically in chronological order, so comparing them against a
 * locally-derived "today" is both simpler and correct everywhere.
 *
 * An unparseable value fails *open*: a typo in the CMS must never lock a
 * benefit the editor did not mean to lock.
 */
export function isUpcoming(
  provider: Pick<ServiceProvider, 'opens_on'> | null | undefined,
  today: string = todayIsoDate()
): boolean {
  const opensOn = provider?.opens_on?.trim();
  if (!isIsoDate(opensOn)) return false;
  // slice(0, 10) keeps this working if the field is ever widened to a timestamp.
  return opensOn.slice(0, 10) > today;
}

/**
 * The opening day as `1.11.2026`, or an empty string when there is none.
 *
 * Formatted from the string parts rather than through `DatePipe`, both to avoid
 * the UTC-parse trap above and because the app registers no locale — `d.M.yyyy`
 * is what it already shows everywhere else.
 */
export function opensOnLabel(provider: Pick<ServiceProvider, 'opens_on'> | null | undefined): string {
  const opensOn = provider?.opens_on?.trim();
  if (!isIsoDate(opensOn)) return '';
  const [year, month, day] = opensOn.slice(0, 10).split('-');
  return `${Number(day)}.${Number(month)}.${year}`;
}

interface DirectusResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ServiceProviderService {
  private http = inject(HttpClient);

  getAll(): Observable<ServiceProvider[]> {
    return this.http
      .get<DirectusResponse<ServiceProvider[]>>(
        `${CMS_BASE_URL}/items/service_provider?fields=*.*`
      )
      .pipe(map((res) => res.data));
  }

  getById(id: number | string): Observable<ServiceProvider> {
    // `*.*` expands the junction rows of `images` but not the files inside
    // them, so the gallery files are requested explicitly.
    return this.http
      .get<DirectusResponse<ServiceProvider>>(
        `${CMS_BASE_URL}/items/service_provider/${id}?fields=*.*,images.directus_files_id.*`
      )
      .pipe(map((res) => res.data));
  }

  bannerUrl(provider: ServiceProvider): string | null {
    return provider.banner ? `${CMS_BASE_URL}/assets/${provider.banner.id}` : null;
  }

  assetUrl(file: DirectusFile): string {
    return `${CMS_BASE_URL}/assets/${file.id}`;
  }

  /** Gallery images of a provider, in editor-defined order, without gaps. */
  galleryImages(provider: ServiceProvider | undefined | null): DirectusFile[] {
    return (provider?.images ?? [])
      .map((row) => row.directus_files_id)
      .filter((file): file is DirectusFile => !!file);
  }

  /**
   * True when the banner is a logo rather than a photo. Logos should be shown
   * in full (`object-fit: contain`) instead of being cropped to fill the frame,
   * which zooms in and cuts off the edges.
   *
   * A banner counts as a logo when it is a vector (SVG), a near-square /
   * portrait PNG, or its Directus title/filename contains "logo" (catches wide
   * raster wordmarks the aspect-ratio test misses). Photo banners are landscape
   * JPEG/WEBP (or wide PNGs), so they stay cropped-to-fill as before.
   */
  isLogoBanner(provider: ServiceProvider): boolean {
    const banner = provider.banner;
    if (!banner) return false;
    if (banner.type?.startsWith('image/svg')) return true;
    if (
      banner.type === 'image/png' &&
      banner.width &&
      banner.height &&
      banner.height / banner.width >= 0.8
    ) {
      return true;
    }
    const label = `${banner.title ?? ''} ${banner.filename_download ?? ''}`.toLowerCase();
    return label.includes('logo');
  }

  /** Records a thumbs up/down for a service provider. Resolves true on success. */
  submitFeedback(serviceProviderId: number, rating: FeedbackRating): Promise<boolean> {
    return firstValueFrom(
      this.http
        .get<{ success?: boolean }>(`${CMS_BASE_URL}/flows/trigger/${FEEDBACK_FLOW}`, {
          params: { service_provider: String(serviceProviderId), rating },
        })
        .pipe(
          map((res) => res?.success === true),
          catchError(() => of(false))
        )
    );
  }

  geocodeAddress(address: string): Observable<{ lat: number; lng: number } | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    return this.http
      .get<Array<{ lat: string; lon: string }>>(url)
      .pipe(
        map((res) =>
          res && res.length > 0 ? { lat: Number(res[0].lat), lng: Number(res[0].lon) } : null
        )
      );
  }
}
