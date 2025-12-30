import { Component, OnInit } from '@angular/core';
import { AuthService, SignUpPayload } from '../../services/auth.service';
import { Router } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.html',
    styleUrl: './signup.scss',
    standalone: false,
})
export class Signup implements OnInit {
    name = '';
    email = '';
    password = '';
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
        if (!this.name || !this.email || !this.password) {
            this.error = 'All fields are required';
            return;
        }
        this.loading = true;
        this.error = null;
        const payload: SignUpPayload = {
            name: this.name,
            email: this.email,
            password: this.password,
        };
        this.auth.signUp(payload).subscribe({
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
}
