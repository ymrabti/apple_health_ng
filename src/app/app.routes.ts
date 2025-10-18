import { Routes } from '@angular/router';
import { Maps } from './maps/maps';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
    {
        component: Dashboard,
        path: 'dash',
    },
    {
        component: Maps,
        path: 'maps',
    },
    {
        redirectTo: '/dash',
        path: '*',
    },
];
