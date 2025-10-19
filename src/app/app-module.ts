import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {  } from '@angular/animations/browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { FormsModule } from '@angular/forms';
import { VerifyEmail } from './verify-email/verify-email';
import { Dashboard } from './dashboard/dashboard';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

@NgModule({
    declarations: [App, VerifyEmail, Dashboard],
    imports: [BrowserModule, FormsModule, AppRoutingModule],
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideHttpClient(),
        provideNoopAnimations(),
        provideAnimationsAsync(),
    ],
    bootstrap: [App],
})
export class AppModule {}
