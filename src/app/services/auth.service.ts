import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';
import { environment } from '../../environments/environment';
import { WebsocketService } from './websocket.service';

// Configure these endpoints via Angular environments
const AUTH_API_BASE = `${environment.apiBase}/auth`;
const OAUTH_AUTHORIZE_BASE = environment.oauthBase;

export interface SignInPayload {
    userName: string;
    password: string;
}

export interface SignUpPayload {
    email: string;
    userName: string;
    firstName: string;
    lastName: string;
    password: string;
    confirmPassword: string;
    photo?: File;
}
interface AuthResponse {
    user: User;
    tokens: Tokens;
}

export interface Tokens {
    access: Access;
    refresh: Access;
}

interface Access {
    token: string;
    expires: string;
}

export interface GlobalSummaryStats {
    sumDistance: number;
    goalAchievements: number;
    daysTracked: number;
    healthScore: number;
    healthGrade: string;
    components: ScoreComponents;
}

export interface ScoreComponents {
    activityScore: number;
    stepsScore: number;
    streakScore: number;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    userName: string;
    gender: string;
    email: string;
    password: string;
    role: string;
    fcm: null;
    photo: string;
    phoneNumber: null;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UserInfos {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    biologicalSex: string;
    bloodType: string;
    fitzpatrickSkinType: string;
    cardioFitnessMedicationsUse: string;
    isEmailVerified: boolean;
    email: string;
    userName: string;
    photo: string;
    role: string;
    weightInKilograms: number | null;
    heightInCentimeters: number | null;
    createdAt: string;
    updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    constructor(
        private http: HttpClient,
        private tokens: TokenService,
        private socket: WebsocketService,
    ) {}

    signIn(payload: SignInPayload): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${AUTH_API_BASE}/signin`, payload);
    }

    signUp(payload: FormData | SignUpPayload): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${AUTH_API_BASE}/signup`, payload);
    }

    signOut(): Observable<void> {
        // Disconnect socket and clear auth state (allows re-initialization on next login)
        this.socket.disconnect(true);
        const tokens = this.tokens.getTokens();
        this.tokens.clearToken();
        const refreshToken = tokens?.refresh.token;
        return this.http.post<void>(
            `${AUTH_API_BASE}/logout`,
            {
                refreshToken: refreshToken,
            },
            { withCredentials: true },
        );
    }

    getUserInfos(): Observable<any> {
        return this.http.get<any>(`${environment.apiBase}/apple-health/user-infos`);
    }

    updateUserInfos(data: {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        weightInKilograms?: number | null;
        heightInCentimeters?: number | null;
    }): Observable<any> {
        return this.http.patch<any>(`${environment.apiBase}/account`, data);
    }

    sendVerificationEmail(): Observable<void> {
        return this.http.post<void>(`${environment.apiBase}/auth/send-verification-email`, {});
    }

    uploadProfilePhoto(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('photo', file, file.name);
        return this.http.post<any>(`${environment.apiBase}/account/photo`, formData);
    }

    changePassword(
        currentPassword: string,
        newPassword: string,
        confirmPassword: string,
    ): Observable<void> {
        return this.http.post<void>(`${environment.apiBase}/auth/change-password`, {
            oldPassword: currentPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword,
        });
    }

    sendResetPasswordEmail(email: string): Observable<void> {
        return this.http.post<void>(`${environment.apiBase}/auth/send-reset-password-email`, {
            email: email,
        });
    }

    resetPassword(token: string, password: string): Observable<void> {
        return this.http.post<void>(
            `${environment.apiBase}/auth/reset-password`,
            { password: password },
            { params: { token: token } },
        );
    }

    startOAuth(provider: string): Observable<{ url: string }> {
        return this.http.get<{ url: string }>(
            `${OAUTH_AUTHORIZE_BASE}/OAuth/callback/authenticate`,
            {
                params: new HttpParams().set('provider', provider),
                withCredentials: true,
                observe: 'body',
            },
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

    refreshToken(): Observable<Tokens> {
        const tokens = this.tokens.getTokens();
        const refreshToken = tokens?.refresh.token;
        return this.http.post<Tokens>(
            `${AUTH_API_BASE}/refresh-tokens`,
            {
                refreshToken: refreshToken,
            },
            { withCredentials: true },
        );
    }
    // Local helper to decode token and get expiration (assuming backend encodes exp in token)
    getAccessTokenExp(): number | null {
        const token = this.tokens.getTokens();
        if (!token) return null;
        try {
            const decoded = token.access;
            return Math.floor(new Date(decoded.expires).getTime() / 1000); // convert to seconds
        } catch (error) {
            return null;
        }
    }

    saveTokenFromResponse(res: AuthResponse): void {
        const token = res.tokens?.access?.token;
        if (token) {
            this.tokens.setToken(token);
            this.tokens.saveTokens(res.tokens);
            // Connect socket after successful login/signup
            this.socket.connect(token);
        }
    }

    getRefreshTokenExp(): number | null {
        const token = this.tokens.getTokens();
        if (!token) return null;
        try {
            const decoded = token.refresh;
            return Math.floor(new Date(decoded.expires).getTime() / 1000); // convert to seconds
        } catch (error) {
            return null;
        }
    }
}
