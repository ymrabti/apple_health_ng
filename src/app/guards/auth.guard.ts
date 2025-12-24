import { Injectable } from '@angular/core';
import {
    CanActivate,
    Router,
    UrlTree,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    private refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    constructor(private tokens: TokenService, private router: Router, private auth: AuthService) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
        const token = this.tokens.getToken();
        const tokens = this.tokens.getTokens();
        if (tokens) {
            if (tokens.access && tokens.refresh) {
                this.startTokenRefreshWatcher();
                try {
                    return true;
                } catch (err) {
                    console.error('Invalid auth data', err);
                }
            }
        } else {
            this.auth.signOut();
            return this.router.createUrlTree(['/signin'], {
                queryParams: { redirect: state.url || '/home' },
            });
        }
        if (token) return true;
        return this.router.createUrlTree(['/signin'], {
            queryParams: { redirect: state.url || '/home' },
        });
    }

    startTokenRefreshWatcher() {
        const exp = this.auth.getAccessTokenExp();
        if (!exp) return;

        const now = Math.floor(Date.now() / 1000); // current time in seconds
        const timeout = (exp - now - 60) * 1000; // refresh 1 min before expiry

        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
        }

        if (timeout > 0) {
            this.refreshTimeout = setTimeout(() => {
                this.auth.refreshToken().subscribe({
                    next: (tokens) => {
                        this.tokens.setToken(tokens.access.token);
                        this.tokens.saveTokens(tokens);
                        this.startTokenRefreshWatcher(); // reset watcher
                    },
                    error: (err) => {
                        console.error('Token refresh failed', err);
                        this.auth.signOut(); // or redirect to login
                    },
                });
            }, timeout);
        } else {
            this.auth.signOut(); // token already expired
        }
    }
}
