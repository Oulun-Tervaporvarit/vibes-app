import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { ServiceProvidersList } from "../service-providers-list/service-providers-list";
import { TranslatePipe } from '../i18n';

@Component({
  selector: 'app-service-provider-tabs',
  imports: [MatTabsModule, MatButtonModule, ServiceProvidersList, RouterLink, TranslatePipe],
  templateUrl: './service-provider-tabs.html',
  styleUrl: './service-provider-tabs.scss',
})
export class ServiceProviderTabs {

}
