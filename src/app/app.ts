import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SeoService } from './services/seo.service';
import { ThemeService } from './services/theme.service';
import { WebsocketService } from './services/websocket.service';
import { TokenService } from './services/token.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.html',
    standalone: false,
    styleUrl: './app.scss',
})
export class App implements OnInit {
    constructor(
        private seo: SeoService,
        private router: Router,
        private themeService: ThemeService,
        private tokenService: TokenService,
        private socket: WebsocketService
    ) {}

    ngOnInit() {
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
}
