import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { DeviceDetectorService } from 'ngx-device-detector';
import { environment } from 'src/environments/environment';

@Injectable()
export class DeviceInfoInterceptor implements HttpInterceptor {
  constructor(private deviceDetectorService: DeviceDetectorService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const ipApi = environment.ipApi;
    // Skip adding device info headers for requests to ipApi
    if (request.url.includes(ipApi)) {
      return next.handle(request);
    }
    const deviceInfo = {
      client_device_user_agent: this.deviceDetectorService.userAgent,
      client_device_browserVersion: this.deviceDetectorService.browser_version,
      client_device_os: this.deviceDetectorService.os,
      client_device_osVersion: this.deviceDetectorService.os_version,
      client_device_browser: this.deviceDetectorService.browser,
      client_device_deviceOrientation: this.deviceDetectorService.orientation
    };

    const requestClone = request.clone({
      setHeaders: deviceInfo
    });

    return next.handle(requestClone);
  }
}