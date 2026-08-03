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
}

export interface ServiceProvider {
  id: number;
  status: string;
  name: string;
  category: ServiceProviderCategory | string;
  free: boolean;
  description: string;
  instructions: string;
  address: string;
  banner: DirectusFile | null;
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
    return this.http
      .get<DirectusResponse<ServiceProvider>>(
        `${CMS_BASE_URL}/items/service_provider/${id}?fields=*.*`
      )
      .pipe(map((res) => res.data));
  }

  bannerUrl(provider: ServiceProvider): string | null {
    return provider.banner ? `${CMS_BASE_URL}/assets/${provider.banner.id}` : null;
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
