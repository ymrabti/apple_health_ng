import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { HealthService } from '../../services/health.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.html',
    styleUrl: './forgot-password.scss',
    standalone: false,
})
export class ForgotPassword implements OnInit {
    email = '';
    loading = false;
    error: string | null = null;
    success = false;

    constructor(
        private router: Router,
        private seo: SeoService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.seo.apply({
            title: 'Forgot Password – AppleHealth Social',
            description: 'Reset your password to regain access to your Apple Health analytics dashboard.',
            type: 'website',
        });
    }

    submit() {
        if (!this.email) {
            this.error = 'Email is required';
            return;
        }

        if (!this.isValidEmail(this.email)) {
            this.error = 'Please enter a valid email address';
            return;
        }

        this.loading = true;
        this.error = null;

        this.authService.sendResetPasswordEmail(this.email).subscribe({
            next: () => {
                this.success = true;
                this.loading = false;
            },
            error: (err) => {
                this.error = err?.error?.message || 'Failed to send reset email. Please try again.';
                this.loading = false;
            },
        });
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
