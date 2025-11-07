import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ScriptsService } from '../services/client/scripts.service';
import { DeviceService } from '../services/client/device.service';
import { AuthService } from '../services/auth/auth.service';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
  constructor(private scriptService: ScriptsService, private deviceService:DeviceService, private authService:AuthService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.handleRequest(request, next);
  }

  handleRequest(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let requestClone = request;
    // For POST requests, encrypt the body if it exists
    if ((request.method === 'POST' || request.method === 'PATCH' )&& request.body) {
      const requestedat = `${Date.now()}`;
      const appAddress = environment.pub_key;
      const accept = 'application/json';
      const origin = environment.appDomain;
      const token:any = this.authService.getToken();
      // Set common headers
      requestClone = requestClone.clone({
        setHeaders: {
          requestedat,
          appAddress,
          accept,
          token
        }
      });
      const requestKey = `${appAddress}${requestedat}${accept}${origin}`;
      console.log(requestKey);
      // this.deviceService.getIp().subscribe()
      try {
        // Assuming body is an object; stringify it first
        const bodyString = typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body);

        // Encrypt using SHA256 via ScriptsService
        const encryptedBody = this.scriptService.encryptWithKey(requestKey, bodyString)
        console.log(bodyString);
        console.log(encryptedBody);
        // Clone again to set the encrypted body
        requestClone = requestClone.clone({
          body: {data:encryptedBody}
        });
      } catch (error) {
        console.error('Encryption failed:', error);
        // Optionally, handle error (e.g., throw or skip encryption)
      }
    }

    return next.handle(requestClone);
  }
}
