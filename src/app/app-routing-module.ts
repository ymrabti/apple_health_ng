import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VerifyEmail } from './verify-email/verify-email';
import { Dashboard } from './dashboard/dashboard';
import { Signin } from './auth/signin/signin';
import { Signup } from './auth/signup/signup';
import { OauthCallback } from './auth/oauth-callback/oauth-callback';
import { AuthGuard } from './guards/auth.guard';
import { ImportHealth } from './import-health/import-health';
import { Profile } from './profile/profile';
import { ForgotPassword } from './auth/forgot-password/forgot-password';

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
    path: 'forgot-password',
    component: ForgotPassword,
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
    canActivate: [AuthGuard],
  },
  {
    path: 'import',
    component: ImportHealth,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: Profile,
    canActivate: [AuthGuard],
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
