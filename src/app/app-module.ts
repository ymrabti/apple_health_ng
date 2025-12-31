import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {  } from '@angular/animations/browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { FormsModule } from '@angular/forms';
import { VerifyEmail } from './verify-email/verify-email';
import { Dashboard } from './dashboard/dashboard';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Signin } from './auth/signin/signin';
import { Signup } from './auth/signup/signup';
import { OauthCallback } from './auth/oauth-callback/oauth-callback';
import { authInterceptor } from './interceptors/auth.interceptor';
import { ImportHealth } from './import-health/import-health';
import { NgApexchartsModule } from 'ng-apexcharts';

@NgModule({
    declarations: [App, VerifyEmail, Dashboard, Signin, Signup, OauthCallback, ImportHealth],
    imports: [BrowserModule, FormsModule, AppRoutingModule, NgApexchartsModule],
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideNoopAnimations(),
        provideAnimationsAsync(),
    ],
    bootstrap: [App],
})
export class AppModule {}
