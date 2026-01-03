export interface ThemeColors {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primaryShadow: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    accent: string;
    background: string;
    backgroundAlt: string;
    surface: string;
    surfaceAlt: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textHeading: string;
    border: string;
    borderLight: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    iconFilter: string;
}

export interface ThemeTypography {
    fontFamily: string;
    fontFamilyHeading: string;
    fontFamilyMono: string;
    fontSizeBase: string;
    fontSizeSmall: string;
    fontSizeLarge: string;
    fontWeightNormal: number;
    fontWeightMedium: number;
    fontWeightBold: number;
}

export interface Theme {
    id: string;
    name: string;
    mode: 'light' | 'dark';
    colors: ThemeColors;
    typography: ThemeTypography;
}

// Cyber theme (current app theme - cyan/purple gradient)
const cyberDark: Theme = {
    id: 'cyber-dark',
    name: 'Cyber Dark',
    mode: 'dark',
    colors: {
        primary: '#22d3ee',
        primaryLight: '#67e8f9',
        primaryDark: '#06b6d4',
        primaryShadow: 'rgba(34, 211, 238, 0.25)',
        secondary: '#a855f7',
        secondaryLight: '#c084fc',
        secondaryDark: '#9333ea',
        accent: '#ec4899',
        background: '#000000',
        backgroundAlt: '#0a0a0a',
        surface: 'rgba(17, 24, 39, 0.5)',
        surfaceAlt: 'rgba(31, 41, 55, 0.6)',
        textPrimary: '#e5e7eb',
        textSecondary: '#9ca3af',
        textMuted: '#6b7280',
        textHeading: '#ffffff',
        border: 'rgba(55, 65, 81, 0.5)',
        borderLight: 'rgba(75, 85, 99, 0.3)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        iconFilter: 'invert(1) opacity(0.85)',
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontFamilyHeading: "'Orbitron', 'Rajdhani', sans-serif",
        fontFamilyMono: "'Fira Code', 'Courier New', monospace",
        fontSizeBase: '1rem',
        fontSizeSmall: '0.875rem',
        fontSizeLarge: '1.125rem',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
};

const cyberLight: Theme = {
    ...cyberDark,
    id: 'cyber-light',
    name: 'Cyber Light',
    mode: 'light',
    colors: {
        ...cyberDark.colors,
        background: '#ffffff',
        backgroundAlt: '#f9fafb',
        surface: 'rgba(243, 244, 246, 0.8)',
        surfaceAlt: 'rgba(229, 231, 235, 0.9)',
        textPrimary: '#1f2937',
        textSecondary: '#4b5563',
        textMuted: '#6b7280',
        textHeading: '#111827',
        border: 'rgba(209, 213, 219, 0.8)',
        borderLight: 'rgba(229, 231, 235, 0.6)',
        iconFilter: 'opacity(0.7)',
    },
};

// Ocean theme - Blue/Teal
const oceanDark: Theme = {
    id: 'ocean-dark',
    name: 'Ocean Dark',
    mode: 'dark',
    colors: {
        iconFilter: 'invert(1) opacity(0.85)',
        primary: '#0ea5e9',
        primaryLight: '#38bdf8',
        primaryDark: '#0284c7',
        primaryShadow: 'rgba(14, 165, 233, 0.25)',
        secondary: '#14b8a6',
        secondaryLight: '#2dd4bf',
        secondaryDark: '#0d9488',
        accent: '#06b6d4',
        background: '#020617',
        backgroundAlt: '#0f172a',
        surface: 'rgba(30, 41, 59, 0.5)',
        surfaceAlt: 'rgba(51, 65, 85, 0.6)',
        textPrimary: '#e2e8f0',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        textHeading: '#f1f5f9',
        border: 'rgba(51, 65, 85, 0.5)',
        borderLight: 'rgba(71, 85, 105, 0.3)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontFamilyHeading: "'Poppins', 'Inter', sans-serif",
        fontFamilyMono: "'Fira Code', 'Courier New', monospace",
        fontSizeBase: '1rem',
        fontSizeSmall: '0.875rem',
        fontSizeLarge: '1.125rem',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 600,
    },
};

const oceanLight: Theme = {
    ...oceanDark,
    id: 'ocean-light',
    name: 'Ocean Light',
    mode: 'light',
    colors: {
        ...oceanDark.colors,
        background: '#ffffff',
        backgroundAlt: '#f8fafc',
        surface: 'rgba(241, 245, 249, 0.8)',
        surfaceAlt: 'rgba(226, 232, 240, 0.9)',
        textPrimary: '#1e293b',
        textSecondary: '#475569',
        textMuted: '#64748b',
        textHeading: '#0f172a',
        border: 'rgba(203, 213, 225, 0.8)',
        borderLight: 'rgba(226, 232, 240, 0.6)',
        iconFilter: 'opacity(0.7)',
    },
};

// Sunset theme - Orange/Purple
const sunsetDark: Theme = {
    id: 'sunset-dark',
    name: 'Sunset Dark',
    mode: 'dark',
    colors: {
        primary: '#f97316',
        primaryLight: '#fb923c',
        primaryDark: '#ea580c',
        primaryShadow: 'rgba(249, 115, 22, 0.25)',
        secondary: '#d946ef',
        secondaryLight: '#e879f9',
        secondaryDark: '#c026d3',
        accent: '#f59e0b',
        background: '#0a0a0a',
        backgroundAlt: '#1a1a1a',
        surface: 'rgba(38, 29, 23, 0.5)',
        surfaceAlt: 'rgba(68, 42, 30, 0.6)',
        textPrimary: '#fef3c7',
        textSecondary: '#fbbf24',
        textMuted: '#d97706',
        textHeading: '#fef08a',
        border: 'rgba(120, 53, 15, 0.5)',
        borderLight: 'rgba(146, 64, 14, 0.3)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        iconFilter: 'invert(1) opacity(0.85)',
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontFamilyHeading: "'Righteous', 'Inter', sans-serif",
        fontFamilyMono: "'Fira Code', 'Courier New', monospace",
        fontSizeBase: '1rem',
        fontSizeSmall: '0.875rem',
        fontSizeLarge: '1.125rem',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
};

const sunsetLight: Theme = {
    ...sunsetDark,
    id: 'sunset-light',
    name: 'Sunset Light',
    mode: 'light',
    colors: {
        ...sunsetDark.colors,
        background: '#fffbeb',
        backgroundAlt: '#fef3c7',
        surface: 'rgba(254, 243, 199, 0.8)',
        surfaceAlt: 'rgba(253, 230, 138, 0.9)',
        textPrimary: '#78350f',
        textSecondary: '#92400e',
        textMuted: '#b45309',
        textHeading: '#451a03',
        border: 'rgba(253, 230, 138, 0.8)',
        borderLight: 'rgba(254, 240, 138, 0.6)',
        iconFilter: 'opacity(0.7)',
    },
};

// Forest theme - Green/Emerald
const forestDark: Theme = {
    id: 'forest-dark',
    name: 'Forest Dark',
    mode: 'dark',
    colors: {
        primary: '#10b981',
        primaryLight: '#34d399',
        primaryDark: '#059669',
        primaryShadow: 'rgba(16, 185, 129, 0.25)',
        secondary: '#14b8a6',
        secondaryLight: '#2dd4bf',
        secondaryDark: '#0d9488',
        accent: '#84cc16',
        background: '#0a0f0a',
        backgroundAlt: '#0f1a0f',
        surface: 'rgba(20, 33, 23, 0.5)',
        surfaceAlt: 'rgba(34, 51, 38, 0.6)',
        textPrimary: '#d1fae5',
        textSecondary: '#6ee7b7',
        textMuted: '#34d399',
        textHeading: '#ecfdf5',
        border: 'rgba(52, 211, 153, 0.3)',
        borderLight: 'rgba(52, 211, 153, 0.2)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        iconFilter: 'invert(1) opacity(0.85)',
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontFamilyHeading: "'Nunito', 'Inter', sans-serif",
        fontFamilyMono: "'Fira Code', 'Courier New', monospace",
        fontSizeBase: '1rem',
        fontSizeSmall: '0.875rem',
        fontSizeLarge: '1.125rem',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 600,
    },
};

const forestLight: Theme = {
    ...forestDark,
    id: 'forest-light',
    name: 'Forest Light',
    mode: 'light',
    colors: {
        ...forestDark.colors,
        background: '#f0fdf4',
        backgroundAlt: '#dcfce7',
        surface: 'rgba(220, 252, 231, 0.8)',
        surfaceAlt: 'rgba(187, 247, 208, 0.9)',
        textPrimary: '#14532d',
        textSecondary: '#166534',
        textMuted: '#15803d',
        textHeading: '#052e16',
        border: 'rgba(187, 247, 208, 0.8)',
        borderLight: 'rgba(220, 252, 231, 0.6)',
        iconFilter: 'opacity(0.7)',
    },
};

// Monochrome theme - Gray scale
const monoChromeDark: Theme = {
    id: 'monochrome-dark',
    name: 'Monochrome Dark',
    mode: 'dark',
    colors: {
        primary: '#f5f5f5',
        primaryLight: '#ffffff',
        primaryDark: '#e5e5e5',
        primaryShadow: 'rgba(245, 245, 245, 0.25)',
        secondary: '#a3a3a3',
        secondaryLight: '#d4d4d4',
        secondaryDark: '#737373',
        accent: '#525252',
        background: '#0a0a0a',
        backgroundAlt: '#171717',
        surface: 'rgba(38, 38, 38, 0.5)',
        surfaceAlt: 'rgba(64, 64, 64, 0.6)',
        textPrimary: '#f5f5f5',
        textSecondary: '#a3a3a3',
        textMuted: '#737373',
        textHeading: '#ffffff',
        border: 'rgba(82, 82, 82, 0.5)',
        borderLight: 'rgba(115, 115, 115, 0.3)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        iconFilter: 'invert(1) opacity(0.85)',
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontFamilyHeading: "'Inter', sans-serif",
        fontFamilyMono: "'Fira Code', 'Courier New', monospace",
        fontSizeBase: '1rem',
        fontSizeSmall: '0.875rem',
        fontSizeLarge: '1.125rem',
        fontWeightNormal: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
    },
};

const monoChromeLight: Theme = {
    ...monoChromeDark,
    id: 'monochrome-light',
    name: 'Monochrome Light',
    mode: 'light',
    colors: {
        ...monoChromeDark.colors,
        background: '#ffffff',
        backgroundAlt: '#fafafa',
        surface: 'rgba(245, 245, 245, 0.8)',
        surfaceAlt: 'rgba(229, 229, 229, 0.9)',
        textPrimary: '#171717',
        textSecondary: '#525252',
        textMuted: '#737373',
        textHeading: '#0a0a0a',
        border: 'rgba(212, 212, 212, 0.8)',
        borderLight: 'rgba(229, 229, 229, 0.6)',
        iconFilter: 'opacity(0.7)',
    },
};

export const THEMES: Theme[] = [
    cyberDark,
    cyberLight,
    oceanDark,
    oceanLight,
    sunsetDark,
    sunsetLight,
    forestDark,
    forestLight,
    monoChromeDark,
    monoChromeLight,
];

export const DEFAULT_THEME = cyberDark;
