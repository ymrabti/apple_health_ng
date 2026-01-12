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
            this.auth.signOut().subscribe({
                next: () => {
                    console.log('Signed out due to invalid auth data');
                },
                error: (err) => {
                    console.error('Error during sign out', err);
                },
            });
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
            this.auth.signOut().subscribe({
                next: () => {
                    console.log('Signed out due to invalid auth data');
                },
                error: (err) => {
                    console.error('Error during sign out', err);
                },
            });
            return;
        }

        const nowMs = Date.now();
        const toMs = (exp: number) => (exp > 1e12 ? exp : exp * 1000);
        const expaMs = toMs(expa);
        const exprMs = toMs(expr);

        // If refresh token is expired, sign out immediately (no navigation from here)
        if (exprMs <= nowMs) {
            this.auth.signOut().subscribe({
                next: () => {
                    console.log('Signed out due to invalid auth data');
                },
                error: (err) => {
                    console.error('Error during sign out', err);
                },
            });
            return;
        }

        // Refresh access token 1 minute before it expires; clamp to a sensible minimum
        const timeoutAccessMs = Math.max(expaMs - nowMs - 60_000, 5_000);

        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }

        // Ensure socket is connected (will be a no-op if already connected)
        /* const currentToken = this.tokens.getToken();
        if (currentToken && this.socket.disconnected) {
            this.socket.connect(currentToken);
        } */

        this.refreshTimeout = setTimeout(() => {
            this.auth.refreshToken().subscribe({
                next: (newTokens) => {
                    this.tokens.setToken(newTokens.access.token);
                    this.tokens.saveTokens(newTokens);
                    // Update socket with new token (handles reconnection internally)
                    this.socket.updateToken(newTokens.access.token);
                    if (this.refreshTimeout) {
                        clearTimeout(this.refreshTimeout);
                        this.refreshTimeout = null;
                    }
                    this.startTokenRefreshWatcher();
                    console.log('Token refreshed successfully', new Date());
                },
                error: (err) => {
                    console.error('Token refresh failed', err);
                    this.auth.signOut().subscribe({
                next: () => {
                    console.log('Signed out due to invalid auth data');
                },
                error: (err) => {
                    console.error('Error during sign out', err);
                },
            });
                },
            });
        }, timeoutAccessMs);
    }
}
