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
import { WebsocketService } from '../services/websocket.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    private refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    constructor(
        private tokens: TokenService,
        private router: Router,
        private auth: AuthService,
        private socket: WebsocketService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
        const token = this.tokens.getToken();
        const tokens = this.tokens.getTokens();
        if (tokens) {
            if (tokens.access && tokens.refresh) {
                try {
                    this.startTokenRefreshWatcher();

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
        const expa = this.auth.getAccessTokenExp();
        const expr = this.auth.getRefreshTokenExp();

        if (expa == null || expr == null) {
            this.auth.signOut();
            return;
        }

        const nowMs = Date.now();
        const toMs = (exp: number) => (exp > 1e12 ? exp : exp * 1000);
        const expaMs = toMs(expa);
        const exprMs = toMs(expr);

        // If refresh token is expired, sign out immediately (no navigation from here)
        if (exprMs <= nowMs) {
            this.auth.signOut();
            return;
        }

        // Refresh access token 1 minute before it expires; clamp to a sensible minimum
        const timeoutAccessMs = Math.max(expaMs - nowMs - 60_000, 5_000);

        if (this.refreshTimeout) {
            this.socket.disconnect();
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
        this.socket.connect(this.tokens.getToken() || undefined);

        this.refreshTimeout = setTimeout(() => {
            this.auth.refreshToken().subscribe({
                next: (newTokens) => {
                    this.tokens.setToken(newTokens.access.token);
                    this.tokens.saveTokens(newTokens);
                    this.socket.disconnect();
                    this.socket.connect(newTokens.access.token);
                    if (this.refreshTimeout) {
                        clearTimeout(this.refreshTimeout);
                        this.refreshTimeout = null;
                    }
                    this.startTokenRefreshWatcher();
                    console.log('Token refreshed successfully', new Date());
                },
                error: (err) => {
                    this.socket.disconnect();
                    console.error('Token refresh failed', err);
                    this.auth.signOut();
                },
            });
        }, timeoutAccessMs);
    }
}
