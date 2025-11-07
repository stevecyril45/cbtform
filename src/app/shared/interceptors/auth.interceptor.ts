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
    const requestedat = `${Date.now()}`;
    const appAddress = environment.pub_key;
    const accept = 'application/json';
    const token:any = this.authService.getToken();
    // Skip verification for requests not targeting the appDomain URL
    if (!request.url.includes(environment.appDomain + "/api")) {
      return next.handle(request);
    }
    return this.authService.requestIp().pipe(
      switchMap((ip) => {
        console.log(ip);
        const reqWithIp = request.clone({ setHeaders: { ip,requestedat,
          appAddress,
          accept,
          token } });
        return next.handle(reqWithIp);
      })
    );


  }
}