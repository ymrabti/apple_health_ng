import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VerifyEmail } from './verify-email/verify-email';
import { Dashboard } from './dashboard/dashboard';
import { Signin } from './auth/signin/signin';
import { Signup } from './auth/signup/signup';
import { OauthCallback } from './auth/oauth-callback/oauth-callback';

const routes: Routes = [
  {
    path: 'signin',
    component: Signin,
  },
  {
    path: 'signup',
    component: Signup,
  },
  {
    path: 'oauth/callback',
    component: OauthCallback,
  },
  {
    path: 'verify-email',
    component: VerifyEmail,
  },
  {
    path: 'home',
    component: Dashboard,
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
