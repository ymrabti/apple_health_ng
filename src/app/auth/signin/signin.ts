import { Component } from '@angular/core';
import { AuthService, SignInPayload } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
  standalone: false,
})
export class Signin {
  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.username || !this.password) {
      this.error = 'Username and password are required';
      return;
    }
    this.loading = true;
    this.error = null;
    const payload: SignInPayload = { userName: this.username, password: this.password };
    this.auth.signIn(payload).subscribe({
      next: (res) => {
        this.auth.saveTokenFromResponse(res);
        this.router.navigateByUrl('/home');
      },
      error: (err) => {
        this.error = err?.error?.message || 'Sign in failed';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
