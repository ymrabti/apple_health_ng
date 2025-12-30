import { Component, OnInit } from "@angular/core";
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SeoService } from './services/seo.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  constructor(private seo: SeoService, private router: Router) {}

  ngOnInit() {
    // Set default site-wide SEO
    this.seo.setDefaults();
    // Add Organization JSON-LD
    this.seo.addJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'AppleHealth Social',
      'url': typeof window !== 'undefined' ? window.location.origin : '/',
      'logo': '/favicon.ico'
    });
    // Update canonical and og:url on navigation
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      const url = (e as NavigationEnd).urlAfterRedirects || (e as NavigationEnd).url;
      const absolute = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
      this.seo.setUrl(absolute);
    });
  }
}