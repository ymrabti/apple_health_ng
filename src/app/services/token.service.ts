import { Injectable } from '@angular/core';
import { Tokens } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TokenService {
    private readonly tokenKey = 'auth_token';
    private readonly tokensKey = 'auth_tokens';

    getToken(): string | null {
        try {
            return localStorage.getItem(this.tokenKey);
        } catch {
            return null;
        }
    }

    getTokens(): Tokens | null {
        try {
            const tokenStr = localStorage.getItem(this.tokensKey);
            if (!tokenStr) return null;
            return JSON.parse(tokenStr) as Tokens;
        } catch {
            return null;
        }
    }

    // Store only the access token for quick access

    setToken(token: string): void {
        try {
            localStorage.setItem(this.tokenKey, token);
        } catch {}
    }

    saveTokens(token: Tokens): void {
        try {
            localStorage.setItem(this.tokensKey, JSON.stringify(token));
        } catch {}
    }

    // Clear stored tokens

    clearToken(): void {
        try {
            localStorage.removeItem(this.tokensKey);
        } catch {}
    }
}
