import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { HealthService } from '../../services/health.service';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.html',
    styleUrl: './reset-password.scss',
    standalone: false,
})
export class ResetPassword implements OnInit {
    token: string | null = null;
    newPassword = '';
    confirmPassword = '';
    loading = false;
    error: string | null = null;
    success = false;
    showPassword = false;
    showConfirmPassword = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private seo: SeoService,
        private healthService: HealthService
    ) {}

    ngOnInit() {
        this.seo.apply({
            title: 'Reset Password – AppleHealth Social',
            description: 'Create a new password for your Apple Health analytics account.',
            type: 'website',
        });

        this.token = this.route.snapshot.queryParamMap.get('token');
        
        if (!this.token) {
            this.error = 'Invalid or missing reset token. Please request a new password reset link.';
        }
    }

    submit() {
        this.error = null;

        if (!this.token) {
            this.error = 'Invalid or missing reset token.';
            return;
        }

        if (!this.newPassword) {
            this.error = 'Please enter a new password';
            return;
        }

        if (this.newPassword.length < 8) {
            this.error = 'Password must be at least 8 characters long';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.error = 'Passwords do not match';
            return;
        }

        this.loading = true;

        this.healthService.resetPassword(this.token, this.newPassword).subscribe({
            next: () => {
                this.success = true;
                this.loading = false;
            },
            error: (err) => {
                this.error = err?.error?.message || 'Failed to reset password. The link may have expired.';
                this.loading = false;
            },
        });
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    goToSignIn(): void {
        this.router.navigate(['/signin']);
    }
}
