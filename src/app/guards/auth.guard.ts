import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenService } from '../services/token.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private tokens: TokenService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const token = this.tokens.getToken();
    if (token) return true;
    return this.router.createUrlTree(['/signin'], {
      queryParams: { redirect: state.url || '/home' },
    });
  }
}
