import { Injectable, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoConfig {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string; // e.g., 'website'
  twitterCard?: 'summary' | 'summary_large_image' | 'player' | 'app';
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(private meta: Meta, private title: Title, @Inject(DOCUMENT) private document: Document) {}

  setTitle(title: string) {
    this.title.setTitle(title);
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ name: 'twitter:title', content: title });
  }

  setDescription(description: string) {
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:description', content: description });
  }

  setUrl(url: string) {
    this.meta.updateTag({ property: 'og:url', content: url });
    const link: HTMLLinkElement | null = this.document.querySelector('link#canonical');
    if (link) {
      link.setAttribute('href', url);
    } else {
      const newLink = this.document.createElement('link');
      newLink.setAttribute('rel', 'canonical');
      newLink.setAttribute('href', url);
      newLink.id = 'canonical';
      this.document.head.appendChild(newLink);
    }
  }

  setImage(imageUrl: string) {
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
  }

  setType(type: string) {
    this.meta.updateTag({ property: 'og:type', content: type });
  }

  setTwitterCard(card: SeoConfig['twitterCard'] = 'summary_large_image') {
    this.meta.updateTag({ name: 'twitter:card', content: card });
  }

  apply(config: SeoConfig) {
    if (config.title) this.setTitle(config.title);
    if (config.description) this.setDescription(config.description);
    if (config.url) this.setUrl(config.url);
    if (config.image) this.setImage(config.image);
    if (config.type) this.setType(config.type);
    if (config.twitterCard) this.setTwitterCard(config.twitterCard);
  }

  addJsonLd(json: object) {
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(json);
    this.document.head.appendChild(script);
  }

  setDefaults(baseUrl?: string) {
    // Attempt to derive URL if not provided
    const url = baseUrl || (typeof window !== 'undefined' ? window.location.href : '/');
    this.apply({
      title: 'AppleHealth Social – Track, Analyze, Share',
      description: 'Track Apple Health data, analyze trends, and share your progress.',
      type: 'website',
      url,
      image: '/favicon.ico',
      twitterCard: 'summary_large_image',
    });
  }
}
