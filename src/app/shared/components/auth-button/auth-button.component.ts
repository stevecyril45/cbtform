import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthComponent } from '../auth/auth.component';
import { AuthService } from '../../services/auth/auth.service';
import { ScriptsService } from '../../services/client/scripts.service';

@Component({
  selector: 'shared-auth-button',
  templateUrl: './auth-button.component.html',
  styleUrls: ['./auth-button.component.scss']
})
export class AuthButtonComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  user: string | null = null;
  fakeUsername = '';

  // Breakpoint: < 768px = mobile
  private readonly MOBILE_BREAKPOINT = 768;

  private authSub: any;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private scripts: ScriptsService
  ) {}

  ngOnInit(): void {
    this.subscribeToAuth();
    this.authService.verify().subscribe();
  }

  private subscribeToAuth(): void {
    this.authSub = this.authService.a$.subscribe(address => {
      if (address) {
        this.isLoggedIn = true;
        this.user = address;
        this.fakeUsername = `AG${this.scripts.hashFnv32a(address, true, Date.now())}`;
      } else {
        this.isLoggedIn = false;
        this.user = null;
        this.fakeUsername = '';
      }
    });
  }

  openLoginModal(): void {
    const isMobile = window.innerWidth < this.MOBILE_BREAKPOINT;

    this.dialog.open(AuthComponent, {
      disableClose: true,
      width: isMobile ? '90vw' : '60vw',
      maxWidth: isMobile ? '90vw' : '500px',   // optional: hard cap
      height: isMobile ? '75vh' : '75vh',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'auth-dialog' // optional, for backdrop styling only
    }).afterClosed().subscribe(() => {
      this.authService.verify().subscribe(); // refresh session
    });
  }

  // Optional: Re-calculate on window resize (e.g. rotate phone)
  @HostListener('window:resize')
  onResize() {
    // You can store current width if needed elsewhere
    // this.isMobile = window.innerWidth < this.MOBILE_BREAKPOINT;
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }
}