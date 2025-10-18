import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Maps } from './maps/maps';
import { Dashboard } from './dashboard/dashboard';

import { defineCustomElements } from '@arcgis/map-components/dist/loader';
@NgModule({
    // declarations: [Maps, Dashboard],
    imports: [CommonModule, FormsModule,],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
    constructor() {
        // Initialize ArcGIS Map Components
        defineCustomElements();
    }
}
