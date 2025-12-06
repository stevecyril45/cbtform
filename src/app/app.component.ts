import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'SMTP';
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
    private media: MediaMatcher
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);

    // Initialize message listener for postMessage
    this._messageListener = (event: MessageEvent) => this.handleMessage(event);
  }

  ngOnInit(): void {


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
