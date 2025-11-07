import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { SmtpService } from '../../services/smtp/smtp.service';

@Injectable({
  providedIn: 'root'
})
export class ConnectedGuard implements CanActivate {
  constructor(private smtpService: SmtpService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.smtpService.isConnected()) {
      return true;
    } else if (this.smtpService.getContract()) {
      return this.router.createUrlTree(['/contract', this.smtpService.getContract()]);
    } else {
      return this.router.createUrlTree(['/contract']);
    }
  }
}