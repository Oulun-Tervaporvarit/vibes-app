import { Routes } from '@angular/router';
import { ServiceProvider } from './service-provider/service-provider';
import { ServiceProviderTabs } from './service-provider-tabs/service-provider-tabs';
import { HowToUse } from './how-to-use/how-to-use';

export const routes: Routes = [
    {
        path: '',
        component: ServiceProviderTabs
    },
    {
        path: 'ohje',
        component: HowToUse
    },
    {
        path: 'service/:id',
        component: ServiceProvider
    }
];
