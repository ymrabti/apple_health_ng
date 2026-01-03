import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Theme, THEMES, DEFAULT_THEME } from '../config/theme.config';

const STORAGE_KEY = 'app-theme';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private currentThemeSubject: BehaviorSubject<Theme>;
    public currentTheme$: Observable<Theme>;

    constructor() {
        const savedThemeId = this.getSavedThemeId();
        const initialTheme = this.getThemeById(savedThemeId) || DEFAULT_THEME;
        this.currentThemeSubject = new BehaviorSubject<Theme>(initialTheme);
        this.currentTheme$ = this.currentThemeSubject.asObservable();
        this.applyTheme(initialTheme);
    }

    /**
     * Get all available themes
     */
    public getThemes(): Theme[] {
        return THEMES;
    }

    /**
     * Get themes grouped by base name
     */
    public getThemeGroups(): { [key: string]: Theme[] } {
        const groups: { [key: string]: Theme[] } = {};
        THEMES.forEach((theme) => {
            const baseName = theme.id.replace('-dark', '').replace('-light', '');
            if (!groups[baseName]) {
                groups[baseName] = [];
            }
            groups[baseName].push(theme);
        });
        return groups;
    }

    /**
     * Get current theme
     */
    public getCurrentTheme(): Theme {
        return this.currentThemeSubject.value;
    }

    /**
     * Set theme by ID
     */
    public setTheme(themeId: string): void {
        const theme = this.getThemeById(themeId);
        if (theme) {
            this.currentThemeSubject.next(theme);
            this.applyTheme(theme);
            this.saveThemeId(themeId);
        }
    }

    /**
     * Toggle between light and dark mode for current theme
     */
    public toggleMode(): void {
        const currentTheme = this.getCurrentTheme();
        const baseId = currentTheme.id.replace('-dark', '').replace('-light', '');
        const targetMode = currentTheme.mode === 'dark' ? 'light' : 'dark';
        const targetThemeId = `${baseId}-${targetMode}`;
        this.setTheme(targetThemeId);
    }

    /**
     * Set theme by base name (will use saved mode or default to dark)
     */
    public setThemeByBase(baseName: string, mode?: 'light' | 'dark'): void {
        const currentTheme = this.getCurrentTheme();
        const targetMode = mode || currentTheme.mode;
        const themeId = `${baseName}-${targetMode}`;
        this.setTheme(themeId);
    }

    /**
     * Get theme by ID
     */
    private getThemeById(themeId: string | null): Theme | null {
        if (!themeId) return null;
        return THEMES.find((t) => t.id === themeId) || null;
    }

    /**
     * Apply theme to document
     */
    private applyTheme(theme: Theme): void {
        const root = document.documentElement;

        // Apply colors
        Object.entries(theme.colors).forEach(([key, value]) => {
            const cssVarName = `--${this.camelToKebab(key)}`;
            root.style.setProperty(cssVarName, value);
        });

        // Apply typography
        Object.entries(theme.typography).forEach(([key, value]) => {
            const cssVarName = `--${this.camelToKebab(key)}`;
            root.style.setProperty(cssVarName, String(value));
        });

        // Set mode attribute
        root.setAttribute('data-theme', theme.id);
        root.setAttribute('data-mode', theme.mode);
    }

    /**
     * Save theme ID to localStorage
     */
    private saveThemeId(themeId: string): void {
        try {
            localStorage.setItem(STORAGE_KEY, themeId);
        } catch (error) {
            console.error('Failed to save theme to localStorage:', error);
        }
    }

    /**
     * Get saved theme ID from localStorage
     */
    private getSavedThemeId(): string | null {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to read theme from localStorage:', error);
            return null;
        }
    }

    /**
     * Convert camelCase to kebab-case
     */
    private camelToKebab(str: string): string {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }
}
