import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Theme } from '../../config/theme.config';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-theme-switcher',
    standalone: false,
    templateUrl: './theme-switcher.html',
    styleUrl: './theme-switcher.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitcher implements OnInit, OnDestroy {
    isExpanded = false;
    currentTheme: Theme | null = null;
    themeGroups: { [key: string]: Theme[] } = {};
    private subscription: Subscription | null = null;

    constructor(
        private themeService: ThemeService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.themeGroups = this.themeService.getThemeGroups();
        this.subscription = this.themeService.currentTheme$.subscribe((theme) => {
            this.currentTheme = theme;
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    toggleExpanded(): void {
        this.isExpanded = !this.isExpanded;
        this.cdr.detectChanges();
    }

    toggleMode(): void {
        this.themeService.toggleMode();
    }

    selectTheme(baseName: string): void {
        this.themeService.setThemeByBase(baseName);
    }

    isThemeActive(baseName: string): boolean {
        if (!this.currentTheme) return false;
        return this.currentTheme.id.startsWith(baseName);
    }

    formatThemeName(name: string): string {
        return name
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
