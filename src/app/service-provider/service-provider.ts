import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { ServiceProviderService } from '../service-provider.service';

@Component({
  selector: 'app-service-provider',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './service-provider.html',
  styleUrl: './service-provider.scss',
})
export class ServiceProvider {
  private route = inject(ActivatedRoute);
  private service = inject(ServiceProviderService);

  item = toSignal(
    this.route.paramMap.pipe(switchMap((params) => this.service.getById(params.get('id')!))),
    { initialValue: undefined }
  );

  bannerSrc = computed(() => {
    const provider = this.item();
    return provider ? this.service.bannerUrl(provider) : null;
  });

  constructor(protected location: Location) {}
}
