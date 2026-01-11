import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, of, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmailVerificationService {
  // Default request timeout (ms)
  private readonly REQUEST_TIMEOUT = 15000;

  constructor(private http: HttpClient) {}

  /**
   * Verify email token.
   * Default API contract:
   *  POST {apiBase}/auth/verify-email
   *  body: { token: "<token>" }
   *
   * Adjust apiBase or HTTP contract as required by your backend.
   */
  verify(token: string, apiBase: string) {
    const url = `${apiBase.replace(/\/$/, '')}/auth/verify-email`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(url, null, { headers, params: { token } }).pipe(
      timeout(this.REQUEST_TIMEOUT),
      map((resp: any) => {
        // If backend returns success indicator, map to { success: true, message }
        // For typical 200 success we return success true
        const message = resp?.message ?? 'Email verified successfully.';
        return { success: true, message };
      }),
      catchError((err: HttpErrorResponse) => {
        let message = 'Verification failed. Please try again.';
        if (err.error && typeof err.error === 'object' && err.error.message) {
          message = err.error.message;
        } else if (err.status === 0) {
          message = 'Network error. Please check your connection and try again.';
        } else if (err.status === 400 || err.status === 404) {
          message = err.error?.message ?? 'Invalid or expired verification token.';
        } else {
          message = err.message || message;
        }
        return of({ success: false, message });
      })
    );
  }
}
