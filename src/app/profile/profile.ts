import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
    @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

    userInfo: UserInfos | null = null;
    loading = false;
    saving = false;
    sendingVerification = false;
    verificationSent = false;
    error: string | null = null;
    success: string | null = null;

    // Photo upload
    uploadingPhoto = false;
    photoPreview: string | null = null;
    selectedPhotoFile: File | null = null;

    // Password change
    showPasswordForm = false;
    changingPassword = false;
    passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    };
    passwordError: string | null = null;
    passwordSuccess: string | null = null;

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
        this.auth.getUserInfos().subscribe({
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

        this.auth.updateUserInfos(this.editData).subscribe({
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

        this.auth.sendVerificationEmail().subscribe({
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
        if (this.photoPreview) {
            return this.photoPreview;
        }
        if (!this.userInfo?.userName || !this.userInfo?.photo) {
            return 'assets/default-avatar.svg';
        }
        return `${environment.apiBase}/account/photo`;
    }

    onAvatarError(event: Event): void {
        const img = event.target as HTMLImageElement;
        img.src = 'assets/default-avatar.svg';
    }
    // Photo upload methods
    triggerPhotoUpload(): void {
        this.photoInput.nativeElement.click();
    }

    onPhotoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.error = 'Please select an image file';
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.error = 'Image size must be less than 5MB';
            return;
        }

        this.selectedPhotoFile = file;
        this.error = null;

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.photoPreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    uploadPhoto(): void {
        if (!this.selectedPhotoFile) return;

        this.uploadingPhoto = true;
        this.error = null;

        this.auth.uploadProfilePhoto(this.selectedPhotoFile).subscribe({
            next: (info) => {
                this.userInfo = info as UserInfos;
                this.photoPreview = null;
                this.selectedPhotoFile = null;
                this.uploadingPhoto = false;
                this.success = 'Profile photo updated successfully!';
            },
            error: (err) => {
                this.error = err?.error?.message || 'Failed to upload photo';
                this.uploadingPhoto = false;
            },
        });
    }

    cancelPhotoUpload(): void {
        this.photoPreview = null;
        this.selectedPhotoFile = null;
        if (this.photoInput) {
            this.photoInput.nativeElement.value = '';
        }
    }

    // Password change methods
    togglePasswordForm(): void {
        this.showPasswordForm = !this.showPasswordForm;
        this.resetPasswordForm();
    }

    resetPasswordForm(): void {
        this.passwordData = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        };
        this.passwordError = null;
        this.passwordSuccess = null;
    }

    changePassword(): void {
        this.passwordError = null;
        this.passwordSuccess = null;

        // Validation
        if (!this.passwordData.currentPassword) {
            this.passwordError = 'Current password is required';
            return;
        }
        if (!this.passwordData.newPassword) {
            this.passwordError = 'New password is required';
            return;
        }
        if (this.passwordData.newPassword.length < 8) {
            this.passwordError = 'New password must be at least 8 characters';
            return;
        }
        if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
            this.passwordError = 'Passwords do not match';
            return;
        }

        this.changingPassword = true;

        this.auth
            .changePassword(
                this.passwordData.currentPassword,
                this.passwordData.newPassword,
                this.passwordData.confirmPassword
            )
            .subscribe({
                next: () => {
                    this.passwordSuccess = 'Password changed successfully!';
                    this.changingPassword = false;
                    this.resetPasswordForm();
                    setTimeout(() => {
                        this.showPasswordForm = false;
                        this.passwordSuccess = null;
                    }, 2000);
                },
                error: (err) => {
                    this.passwordError = err?.error?.message || 'Failed to change password';
                    this.changingPassword = false;
                },
            });
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    logout(): void {
        this.auth.signOut().subscribe({
            next: () => {
                this.router.navigate(['/signin']);
            },
            error: () => {
                // Even on error, navigate to signin
                this.router.navigate(['/signin']);
            },
        });
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
