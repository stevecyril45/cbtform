import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

@Injectable()
export class IpInterceptor implements HttpInterceptor {

  constructor(private as: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    if (request.method === 'POST' || request.method === 'PATCH') {
      return this.as.requestIp().pipe(
        switchMap((ip) => {
          console.log(ip);
          const reqWithIp = request.clone({ setHeaders: { ip } });
          return next.handle(reqWithIp);
        })
      );
    } else {
      return next.handle(request);
    }
  }
}

