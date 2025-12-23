import { Component } from '@angular/core';
import { AuthService, SignInPayload } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

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

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

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
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/home';
        this.router.navigateByUrl(redirect);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Sign in failed';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
