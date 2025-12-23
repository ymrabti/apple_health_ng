import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';

// Configure these endpoints via Angular environments
const AUTH_API_BASE = `${environment.apiBase}/auth`;
const OAUTH_AUTHORIZE_BASE = environment.oauthBase;

export interface SignInPayload {
    userName: string;
    password: string;
}

export interface SignUpPayload {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user?: { id: string; name: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    constructor(private http: HttpClient, private tokens: TokenService) {}

    signIn(payload: SignInPayload): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${AUTH_API_BASE}/signin`, payload);
    }

    signUp(payload: SignUpPayload): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${AUTH_API_BASE}/signup`, payload);
    }

    saveTokenFromResponse(res: AuthResponse): void {
        if (res?.token) this.tokens.setToken(res.token);
    }

    startOAuth(provider: string, redirectUri: string): Observable<{ url: string }> {
        return this.http.get<{ url: string }>(
            `${OAUTH_AUTHORIZE_BASE}/OAuth/callback/authenticate`,
            {
                params: new HttpParams().set('provider', provider).set('redirect_uri', redirectUri),
            }
        );
    }

    handleOAuthCallback(params: {
        code?: string;
        state?: string;
        error?: string;
    }): Observable<AuthResponse> {
        const httpParams = new HttpParams({ fromObject: params as Record<string, string> });
        return this.http.get<AuthResponse>(`${OAUTH_AUTHORIZE_BASE}/callback`, {
            params: httpParams,
            withCredentials: true,
        });
    }

    signOut(): void {
        this.tokens.clearToken();
    }

    getToken(): string | null {
        return this.tokens.getToken();
    }
}
