import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

const CMS_BASE_URL = 'https://cms.allvibes.fi';

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
}
