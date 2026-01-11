import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserInfos } from '../services/auth.service';
import { HealthService } from '../services/health.service';
import { SeoService } from '../services/seo.service';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.html',
    styleUrl: './profile.scss',
    standalone: false,
})
export class Profile implements OnInit {
    userInfo: UserInfos | null = null;
    loading = false;
    saving = false;
    sendingVerification = false;
    verificationSent = false;
    error: string | null = null;
    success: string | null = null;

    // Editable fields
    editMode = false;
    editData = {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        weightInKilograms: null as number | null,
        heightInCentimeters: null as number | null,
    };

    constructor(
        private auth: AuthService,
        private health: HealthService,
        private router: Router,
        private seo: SeoService
    ) {}

    ngOnInit(): void {
        this.seo.apply({
            title: 'Profile – AppleHealth Social',
            description: 'View and edit your profile information.',
            type: 'website',
        });
        this.loadUserInfo();
    }

    loadUserInfo(): void {
        this.loading = true;
        this.error = null;
        this.health.getUserInfos().subscribe({
            next: (info) => {
                this.userInfo = info as UserInfos;
                this.resetEditData();
                this.loading = false;
            },
            error: (err) => {
                this.error = err?.error?.message || 'Failed to load profile';
                this.loading = false;
            },
        });
    }

    resetEditData(): void {
        if (this.userInfo) {
            this.editData = {
                firstName: this.userInfo.firstName || '',
                lastName: this.userInfo.lastName || '',
                dateOfBirth: this.userInfo.dateOfBirth
                    ? this.userInfo.dateOfBirth.split('T')[0]
                    : '',
                weightInKilograms: this.userInfo.weightInKilograms,
                heightInCentimeters: this.userInfo.heightInCentimeters,
            };
        }
    }

    toggleEditMode(): void {
        this.editMode = !this.editMode;
        if (!this.editMode) {
            this.resetEditData();
        }
        this.error = null;
        this.success = null;
    }

    saveProfile(): void {
        this.saving = true;
        this.error = null;
        this.success = null;

        this.health.updateUserInfos(this.editData).subscribe({
            next: (info) => {
                this.userInfo = info as UserInfos;
                this.editMode = false;
                this.success = 'Profile updated successfully!';
                this.saving = false;
            },
            error: (err) => {
                this.error = err?.error?.message || 'Failed to update profile';
                this.saving = false;
            },
        });
    }

    sendVerificationEmail(): void {
        this.sendingVerification = true;
        this.error = null;
        this.verificationSent = false;

        this.health.sendVerificationEmail().subscribe({
            next: () => {
                this.verificationSent = true;
                this.sendingVerification = false;
                this.success = 'Verification email sent! Please check your inbox.';
            },
            error: (err) => {
                this.error = err?.error?.message || 'Failed to send verification email';
                this.sendingVerification = false;
            },
        });
    }

    getUserPhotoUrl(): string {
        if (!this.userInfo?.userName || !this.userInfo?.photo) {
            return 'assets/default-avatar.svg';
        }
        return `${environment.apiBase}/account/photo`;
    }

    onAvatarError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = 'assets/default-avatar.png';
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    logout(): void {
        this.auth.signOut();
        this.router.navigate(['/signin']);
    }

    formatDate(dateString: string): string {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
}
