import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthComponent } from '../auth/auth.component';
import { AuthService } from '../../services/auth/auth.service';
import { DeviceService } from '../../services/client/device.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'shared-auth-button',
  templateUrl: './auth-button.component.html',
  styleUrls: ['./auth-button.component.scss']
})
export class AuthButtonComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  user: any = null;
  showStartButton = false;
  private tokenSubscription: Subscription | undefined;

  constructor(
    private dialog: MatDialog,
    private as: AuthService,
    private ds: DeviceService,
    private router: Router
  ) { }

  ngOnInit(): void {
       // Subscribe to token$ for reactive updates on login/logout
       this.tokenSubscription = this.as.token$.subscribe(token => {
        if (!token) {
          this.isLoggedIn = false;
          return;
        }else{
          this.isLoggedIn = true;
        }
      
      });
      // Token exists: verify it
      this.as.verify().subscribe({
        next: (result: any) => {
          if (result && result.valid) {
            this.user = result.valid; // Set full result as user
            this.isLoggedIn = true;
            // On initial load or re-verify, proceed to start 
          }
        },
        error: (error) => {
          console.error('Verify error:', error);
          this.user = null;
          this.isLoggedIn = false;
        
        }
      });
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  openLoginModal(): void {
    const dialogRef = this.dialog.open(AuthComponent, {
      disableClose: true,
      panelClass: 'custom-dialog-pane',
      width: '100%',
      maxWidth: '40vw',
      height: '65vh',
      maxHeight: '80vh',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog closed with:', result);
      if (result) {
        // Directly proceed to start after successful login
      }
    });
  }

  logout(): void {
    this.as.clearToken(); // Triggers subscription to update state
  }


}