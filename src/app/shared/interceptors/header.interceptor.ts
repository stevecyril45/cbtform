import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ScriptsService } from '../services/client/scripts.service';
import { AuthService } from '../services/auth/auth.service';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {

  constructor(
    private scriptService: ScriptsService,
    private authService: AuthService
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {

    // 🚀 BYPASS ENCRYPTION FOR FIREBASE
    if (request.url.includes('firebaseio.com')) {
      // Ensure Firebase gets plain JSON without custom headers
      return next.handle(request);
    }

    // Only encrypt POST / PATCH requests
    if (!request.body || (request.method !== 'POST' && request.method !== 'PATCH')) {
      return next.handle(request);
    }

    const requestedat = Date.now().toString();
    const appAddress = environment.pub_key;
    const accept = 'application/json';
    const origin = environment.appDomain;

    const requestKey = `${appAddress}${requestedat}${accept}${origin}`;

    // Base headers for your backend
    const baseHeaders: Record<string, string> = {
      requestedat,
      appAddress,
      accept,
      origin,
    };

    let modifiedRequest = request;

    // Auth headers
    if (this.authService.isAuthenticated) {
      Object.assign(baseHeaders, {
        a: this.authService.a || '',
        c: this.authService.c || '',
        d: this.authService.d || '',
        i: this.authService.i || '',
        t: this.authService.t || '',
      });
    }

    // Add headers
    modifiedRequest = request.clone({
      setHeaders: baseHeaders
    });

    // Encrypt body
    try {
      const rawBody = typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body);

      const encryptedBody = this.scriptService.encryptWithKey(requestKey, rawBody);

      modifiedRequest = modifiedRequest.clone({
        body: { data: encryptedBody }
      });

    } catch (err: any) {
      console.error('Body encryption failed:', err);
      return throwError(() => new Error('Request encryption failed: ' + err.message));
    }

    return next.handle(modifiedRequest);
  }
}
