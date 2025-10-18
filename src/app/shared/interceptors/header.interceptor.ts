import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../services/user/user.service';

@Injectable()
export class HeaderInterceptor implements HttpInterceptor {
  constructor(private router: Router, private userService: UserService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.handleRequest(request, next);
  }

  handleRequest(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const user = this.userService.getCurrentUser();
    const authHeader = user?.auth?.email ? user.auth.email : 'GUEST';

    const requestClone = request.clone({
      setHeaders: {
        auth: authHeader
      }
    });

    return next.handle(requestClone);
  }
}