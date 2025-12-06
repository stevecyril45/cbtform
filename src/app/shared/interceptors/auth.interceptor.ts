import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { environment } from 'src/environments/environment';
import { DeviceService } from '../services/client/device.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private ds:DeviceService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip verification for requests not targeting the appDomain URL
    if (!request.url.includes(environment.appDomain)) {
      return next.handle(request);
    }

    // For requests to appDomain, verify auth first
    return this.authService.verify().pipe(
      switchMap((result) => {
        console.log(result.valid);
        if (result.valid) {
          return next.handle(request);
        } else {
          this.authService.logout();
          this.ds.oInfoNotification('Connect Afro Gift I.D', `No Afro Gift I.D Conencted, Please connect your Afro Gift I.D`)
          // Return unauthenticated error
          const error = new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthenticated'
          });
          return throwError(() => error);
        }
      })
    );
  }
}