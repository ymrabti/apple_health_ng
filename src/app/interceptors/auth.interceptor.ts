import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const token = tokens.getToken();

  // Always include credentials for cookie-based auth fallback
  let authReq = req.clone({
    withCredentials: true,
  });

  if (token) {
    authReq = authReq.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(authReq);
};
