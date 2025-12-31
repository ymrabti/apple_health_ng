import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.html',
    styleUrl: './signup.scss',
    standalone: false,
})
export class Signup implements OnInit, OnDestroy {
    email = '';
    userName = '';
    firstName = '';
    lastName = '';
    password = '';
    confirmPassword = '';
    photo: File | null = null;
    photoPreview: string | null = null;
    loading = false;
    error: string | null = null;

    constructor(private auth: AuthService, private router: Router, private seo: SeoService) {}

    ngOnInit() {
        this.seo.apply({
            title: 'Create Account – AppleHealth Social',
            description: 'Sign up to start tracking Apple Health data and analyzing your trends.',
            type: 'website',
        });
    }

    submit() {
        if (!this.email || !this.userName || !this.firstName || !this.lastName || !this.password || !this.confirmPassword) {
            this.error = 'All fields are required';
            return;
        }
        if (this.password !== this.confirmPassword) {
            this.error = 'Passwords do not match';
            return;
        }
        if (!this.photo) {
            this.error = 'Profile photo is required';
            return;
        }
        this.loading = true;
        this.error = null;
        const formData = new FormData();
        formData.append('photo', this.photo, this.photo.name || 'photo');
        formData.append('email', this.email);
        formData.append('userName', this.userName);
        formData.append('firstName', this.firstName);
        formData.append('lastName', this.lastName);
        formData.append('password', this.password);
        formData.append('confirmPassword', this.confirmPassword);
        this.auth.signUp(formData).subscribe({
            next: (res) => {
                this.auth.saveTokenFromResponse(res);
                this.router.navigateByUrl('/home');
            },
            error: (err) => {
                this.error = err?.error?.message || 'Sign up failed';
                this.loading = false;
            },
            complete: () => (this.loading = false),
        });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            this.photo = null;
            this.photoPreview = null;
            return;
        }
        this.photo = file;
        if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
        this.photoPreview = URL.createObjectURL(file);
    }

    ngOnDestroy(): void {
        if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
    }
}
