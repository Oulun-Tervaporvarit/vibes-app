import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { ServiceProvidersList } from "../service-providers-list/service-providers-list";

@Component({
  selector: 'app-service-provider-tabs',
  imports: [MatTabsModule, MatButtonModule, ServiceProvidersList],
  templateUrl: './service-provider-tabs.html',
  styleUrl: './service-provider-tabs.scss',
})
export class ServiceProviderTabs {

}
