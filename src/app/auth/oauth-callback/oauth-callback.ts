import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-oauth-callback',
    templateUrl: './oauth-callback.html',
    styleUrl: './oauth-callback.scss',
    standalone: false,
})
export class OauthCallback implements OnInit {
    status = 'Initializing OAuth…';
    error: string | null = null;

    constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

    ngOnInit(): void {
        const qp = this.route.snapshot.queryParamMap;
        const provider = qp.get('provider') || undefined;
        const code = qp.get('code') || undefined;
        const state = qp.get('state') || undefined;
        const error = qp.get('error') || undefined;

        if (error) {
            this.status = 'OAuth error';
            this.error = error;
            return;
        }

        // If we have a code, finish the OAuth with backend
        if (code || state) {
            this.status = 'Completing sign-in…';
            this.auth.handleOAuthCallback({ code, state }).subscribe({
                next: (res) => {
                    this.auth.saveTokenFromResponse(res);
                    this.router.navigateByUrl('/home');
                },
                error: (err) => {
                    this.status = 'Failed to complete sign-in';
                    this.error = err?.error?.message || 'OAuth exchange failed';
                },
            });
            return;
        }

        // Otherwise, start the OAuth for the selected provider
        if (provider) {
            // const redirectUri = window.location.origin + '/oauth/callback';
            this.status = 'Redirecting to provider…';
            this.auth.startOAuth(provider).subscribe({
                next: ({ url }) => {
                    window.location.href = url;
                },
                error: (err) => {
                    console.log(err);
                    this.status = 'Failed to start OAuth';
                    this.error = err?.error?.message || 'Could not start OAuth';
                },
            });
        } else {
            this.status = 'No provider specified';
        }
    }
}
