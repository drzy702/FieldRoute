import { Injectable, Provider } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Authentication } from '../services/authentication';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authentication: Authentication) {}
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApi = request.url.startsWith('http://localhost:3000/api/');
    const isLogin = /\/(login|register)$/.test(request.url);
    if (isApi && !isLogin && this.authentication.isLoggedIn()) {
      request = request.clone({ setHeaders: { Authorization: `Bearer ${this.authentication.getToken()}` } });
    }
    return next.handle(request);
  }
}
export const authInterceptProvider: Provider = { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true };
