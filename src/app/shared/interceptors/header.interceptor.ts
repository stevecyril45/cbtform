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

    // Only encrypt/intercept POST and PATCH requests with body
    if (!request.body || (request.method !== 'POST' && request.method !== 'PATCH')) {
      return next.handle(request);
    }

    const requestedat = Date.now().toString();
    const appAddress = environment.pub_key;
    const accept = 'application/json';
    const origin = environment.appDomain;

    // This key is used to encrypt the body (backend decrypts with same logic)
    const requestKey = `${appAddress}${requestedat}${accept}${origin}`;

    // Base headers — always sent
    const baseHeaders: Record<string, string> = {
      requestedat,
      appAddress,
      accept,
      origin,
    };

    let modifiedRequest = request;

    // === ADD AUTH HEADERS ONLY IF USER IS AUTHENTICATED ===
    if (this.authService.isAuthenticated) {
      console.log('User authenticated → adding auth headers (a, c, d, i, t)');

      Object.assign(baseHeaders, {
        a: this.authService.a || '',   // Address (email-based ID)
        c: this.authService.c || '',   // Contract
        d: this.authService.d || '',   // DOB proof
        i: this.authService.i || '',   // IP address
        t: this.authService.t || '',   // Auth timestamp
      });
    } else {
      console.log('User not authenticated → sending without auth headers');
    }

    // Apply all headers
    modifiedRequest = request.clone({
      setHeaders: baseHeaders
    });

    // === ENCRYPT BODY (even unauthenticated requests can be encrypted) ===
    try {
      const rawBody = typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body);

      const encryptedBody = this.scriptService.encryptWithKey(requestKey, rawBody);

      // Wrap encrypted data in { data: "..." } — this is what your backend expects
      modifiedRequest = modifiedRequest.clone({
        body: { data: encryptedBody }
      });

      console.log('Encrypted request sent →', modifiedRequest.url);
      if (this.authService.isAuthenticated) {
        console.table({
          a: this.authService.a,
          c: this.authService.c,
          d: this.authService.d?.substring(0, 16) + '...',
          i: this.authService.i,
          t: this.authService.t
        });
      }

    } catch (err: any) {
      console.error('Body encryption failed:', err);
      return throwError(() => new Error('Request encryption failed: ' + err.message));
    }

    return next.handle(modifiedRequest);
  }
}