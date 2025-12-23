import { Component } from '@angular/core';
import { AuthService, SignUpPayload } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  standalone: false,
})
export class Signup {
  name = '';
  email = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.name || !this.email || !this.password) {
      this.error = 'All fields are required';
      return;
    }
    this.loading = true;
    this.error = null;
    const payload: SignUpPayload = { name: this.name, email: this.email, password: this.password };
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
