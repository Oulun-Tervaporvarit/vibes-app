import { Routes } from '@angular/router';
import { ServiceProvider } from './service-provider/service-provider';
import { ServiceProviderTabs } from './service-provider-tabs/service-provider-tabs';

export const routes: Routes = [
    {
        path: '',
        component: ServiceProviderTabs
    },
    {
        path: 'service/:id',
        component: ServiceProvider
    }
];
