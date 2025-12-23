import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
    private readonly tokenKey = 'auth_token';

    getToken(): string | null {
        try {
            return localStorage.getItem(this.tokenKey);
        } catch {
            return null;
        }
    }

    saveTokens(token: string): void {
        this.setToken(token);
    }

    setToken(token: string): void {
        try {
            localStorage.setItem(this.tokenKey, token);
        } catch {}
    }

    clearToken(): void {
        try {
            localStorage.removeItem(this.tokenKey);
        } catch {}
    }
}
