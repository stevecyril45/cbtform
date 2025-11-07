import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './shared/services/auth/auth.service';
import { DeviceService } from './shared/services/client/device.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Auth';
  mobileQuery: MediaQueryList;
  parentUrl: string | null = null;

  fillerContent = Array.from(
    { length: 8 },
    (_, i) => `Index: ${i}`,
  );

  private _mobileQueryListener: () => void;
  private _messageListener: (event: MessageEvent) => void;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private router: Router,
    private authService: AuthService,
    private deviceService: DeviceService
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);

    // Initialize message listener for postMessage
    this._messageListener = (event: MessageEvent) => this.handleMessage(event);
  }

  ngOnInit(): void {
    // Add message listener for cross-origin parent URL
    window.addEventListener('message', this._messageListener);

  }



  // Handle incoming postMessage from parent
  private handleMessage(event: MessageEvent): void {

    // Validate message structure
    if (!event.data || typeof event.data !== 'object' || event.data.type !== 'PARENT_URL') {
      if (event.data.source != 'react-devtools-content-script') {
        console.warn('Invalid message format:', event.data);
      }
      return;
    }

  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
    window.removeEventListener('message', this._messageListener);
  }
}
