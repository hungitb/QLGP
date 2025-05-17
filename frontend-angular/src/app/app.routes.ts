import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    { path: "", component: LayoutComponent, title: "Quản lý gia phả", children: [
        { path: "", component: DashboardComponent }
    ] }
];
