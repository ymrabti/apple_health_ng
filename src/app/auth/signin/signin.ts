import { Component, OnInit } from '@angular/core';
import { AuthService, SignInPayload } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
  standalone: false,
})
export class Signin implements OnInit {
  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute, private seo: SeoService) {}

  ngOnInit() {
    this.seo.apply({
      title: 'Sign In – AppleHealth Social',
      description: 'Sign in to access your Apple Health analytics dashboard and track progress.',
      type: 'website',
    });
  }

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
