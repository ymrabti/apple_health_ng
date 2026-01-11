import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, take } from 'rxjs/operators';
import { EmailVerificationService } from '../services/email-verification.service';
import { SeoService } from '../services/seo.service';
import { environment } from '../../environments/environment';

type VerifyResult = { success: boolean; message?: string };

enum VerifyState {
    Idle = 'Idle',
    Loading = 'Loading',
    Success = 'Success',
    Error = 'Error',
    NoToken = 'NoToken',
}

@Component({
    selector: 'app-verify-email',
    standalone: false,
    templateUrl: './verify-email.html',
    styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit, OnDestroy {
    // Optional: token passed directly to component (overrides query param)
    @Input() token?: string | null;

    // Base URL for the API (e.g. https://api.healthanalytics.app)
    @Input() apiBase: string = `${environment.apiBase}`;

    // Where to go on success (route or absolute URL)
    @Input() redirectUrl: string = '/dashboard';

    state = VerifyState.Idle;
    VerifyState = VerifyState; // expose to template
    message = '';
    private tokenFound?: string;
    private animationTimeouts: number[] = [];

    constructor(
        private activatedRoute: ActivatedRoute,
        public router: Router,
        private service: EmailVerificationService,
        private seo: SeoService
    ) {}

    ngOnInit(): void {
        // Page-specific SEO
        this.seo.apply({
            title: 'Verify Email – AppleHealth Social',
            description: 'Verify your email to secure your account and access the dashboard.',
            type: 'website',
        });
        // Add a small delay to let the initial animation play
        setTimeout(() => {
            this.startVerification();
        }, 300);
    }

    ngOnDestroy(): void {
        // Clean up any pending timeouts
        this.animationTimeouts.forEach((timeout) => clearTimeout(timeout));
    }

    private startVerification(): void {
        // Start verification process
        this.state = VerifyState.Loading;
        this.message = 'Initializing verification process...';

        // Simulate realistic loading states
        const loadingSteps = [
            { message: 'Checking verification token...', delay: 500 },
            { message: 'Validating with server...', delay: 800 },
            { message: 'Processing verification...', delay: 600 },
        ];

        let currentStep = 0;
        const nextStep = () => {
            if (currentStep < loadingSteps.length) {
                this.message = loadingSteps[currentStep].message;
                const timeout = setTimeout(() => {
                    currentStep++;
                    nextStep();
                }, loadingSteps[currentStep].delay);
                this.animationTimeouts.push(timeout);
            } else {
                this.processToken();
            }
        };

        nextStep();
    }

    private processToken(): void {
        // Priority: @Input token
        const tokenFromInput = (this.token ?? '').toString().trim();
        if (tokenFromInput) {
            this.tokenFound = tokenFromInput;
            this.verify(tokenFromInput);
            return;
        }

        // Otherwise attempt to read query parameter 'token'
        this.activatedRoute.queryParams.pipe(take(1)).subscribe((params) => {
            const tokenFromQuery = (params['token'] ?? '').toString().trim();
            if (tokenFromQuery) {
                this.tokenFound = tokenFromQuery;
                this.verify(tokenFromQuery);
            } else {
                this.state = VerifyState.NoToken;
                this.message = 'No verification token found in the link.';
            }
        });
    }

    private verify(token: string): void {
        this.state = VerifyState.Loading;
        this.message = 'Verifying your email address...';

        this.service
            .verify(token, this.apiBase)
            .pipe(
                take(1),
                finalize(() => {
                    // Animation cleanup handled in ngOnDestroy
                })
            )
            .subscribe({
                next: (result: VerifyResult) => {
                    if (result.success) {
                        this.transitionToState(
                            VerifyState.Success,
                            result.message || 'Your email has been successfully verified!',
                            500
                        );
                    } else {
                        this.transitionToState(
                            VerifyState.Error,
                            result.message ||
                                'Verification failed. The token may be invalid or expired.',
                            500
                        );
                    }
                },
                error: (err) => {
                    this.transitionToState(
                        VerifyState.Error,
                        'Network error while verifying. Please check your connection and try again.',
                        500
                    );
                },
            });
    }

    // Get status class for styling
    getStatusClass(): string {
        switch (this.state) {
            case VerifyState.Success:
                return 'success';
            case VerifyState.Error:
                return 'error';
            case VerifyState.Loading:
                return 'loading';
            case VerifyState.NoToken:
                return 'no-token';
            default:
                return 'loading';
        }
    }

    // Retry the verification (if we have a found token)
    retry(): void {
        if (this.tokenFound) {
            this.verify(this.tokenFound);
        } else {
            // Force re-check query params
            this.startVerification();
        }
    }

    // Navigate to configured app location (supports external absolute URLs)
    openApp(): void {
        // Add success feedback before navigation
        if (this.redirectUrl.startsWith('http')) {
            window.location.href = this.redirectUrl;
        } else {
            this.router.navigateByUrl(this.redirectUrl);
        }
    }

    // Navigate to resend verification route
    goResend(): void {
        // Navigate to resend verification route (adjust to your route)
        this.router.navigateByUrl('/resend-verification');
    }

    // Contact support action with improved UX
    /* contactSupport(): void {
        // In a real app, this could open a support chat, email form, or help center
        const supportOptions = [
            'Email: support@healthanalytics.app',
            'Help Center: help.healthanalytics.app',
            'Live Chat: Available 24/7',
        ];

        const message = `Need help with email verification?\n\n${supportOptions.join(
            '\n'
        )}\n\nWe're here to help!`;

        if (confirm(message + '\n\nWould you like to visit our help center?')) {
            // In a real app, redirect to actual help center
            window.open('https://help.healthanalytics.app', '_blank');
        }
    } */

    // Add smooth loading state transitions
    private transitionToState(newState: VerifyState, newMessage: string, delay: number = 0): void {
        const timeout = setTimeout(() => {
            this.state = newState;
            this.message = newMessage;
        }, delay);
        this.animationTimeouts.push(timeout);
    }
}
