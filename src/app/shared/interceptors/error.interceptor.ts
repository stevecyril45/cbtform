import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { DeviceService } from '../services/client/device.service';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private ds: DeviceService, private as:AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {

    return next.handle(request).pipe(
      retry(1),           // retry once on failure
      timeout(30000),     // 30 second timeout
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error:', error);

        let message = 'Unknown error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          message = error.error.message;
        } else {
          // Server-side error
          if (error.error?.error) {
            message = error.error.error;
          } else if (error.error?.message) {
            message = error.error.message;
          } else if (typeof error.error === 'string') {
            message = error.error;
          } else {
            message = `Error Code: ${error.status}\nMessage: ${error.message}`;
          }
        }

        this.ds.oErrorNotification('Network Error', message);
        if(message =="Contract not found or expired"){
          this.as.logout();
        }
        return throwError(error); // Modern RxJS syntax
      })
    );
  }
}