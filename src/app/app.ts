import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SeoService } from './services/seo.service';
import { ThemeService } from './services/theme.service';
import { WebsocketService } from './services/websocket.service';
import { TokenService } from './services/token.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    standalone: false,
    styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
    private connectionSub?: Subscription;

    constructor(
        private seo: SeoService,
        private router: Router,
        private themeService: ThemeService,
        private tokenService: TokenService,
        private socket: WebsocketService
    ) {}

    ngOnInit() {
        // Initialize WebSocket connection if user is already logged in
        this.initializeSocketConnection();

        // Initialize theme service (loads saved theme from localStorage)
        this.themeService.getCurrentTheme();

        // Set default site-wide SEO
        this.seo.setDefaults();
        // Add Organization JSON-LD
        this.seo.addJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'AppleHealth Social',
            url: typeof window !== 'undefined' ? window.location.origin : '/',
            logo: '/favicon.ico',
        });
        // Update canonical and og:url on navigation
        this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
            const url = (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url;
            const absolute =
                typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
            this.seo.setUrl(absolute);
        });
    }

    ngOnDestroy() {
        this.connectionSub?.unsubscribe();
    }

    /**
     * Initialize socket connection on app load if user is authenticated
     */
    private initializeSocketConnection(): void {
        const token = this.tokenService.getToken();
        const tokens = this.tokenService.getTokens();

        // Only connect if we have valid tokens
        if (token && tokens?.access && tokens?.refresh) {
            // Check if tokens are not expired
            const refreshExpiry = new Date(tokens.refresh.expires).getTime();
            if (refreshExpiry > Date.now()) {
                this.socket.initialize(token);
            }
        }

        // Subscribe to connection status for debugging
        this.connectionSub = this.socket.getConnectionStatus().subscribe((connected) => {
            console.log(`Socket connection status: ${connected ? 'connected' : 'disconnected'}`);
        });
    }
}
