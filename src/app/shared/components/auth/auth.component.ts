
import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef,MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { DeviceService } from '../../services/client/device.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'shared-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit, OnDestroy {

  @ViewChild('loginIframe') loginIframe!: ElementRef<HTMLIFrameElement>;
  private messageHandler: (event: MessageEvent) => void;
  src: SafeResourceUrl;

  constructor(
    public dialogRef: MatDialogRef<AuthComponent>,
    private sanitizer: DomSanitizer,
    private as: AuthService,
    private ds:DeviceService
  ) {
    // Sanitize the iframe src URL
    const url = environment.authUrl;
    this.src = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    console.log('Sanitized iframe src:', url);

    this.messageHandler = this.handleMessage.bind(this);
  }

  ngOnInit() {
    window.addEventListener('message', this.messageHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.messageHandler);
  }

  private handleMessage(event: MessageEvent) {
    // console.log(event)
    if (event.origin !== environment.authUrl) return;
    console.log('Message received:', event.data);
    // this.userService.saveUserData(event.data);
    if (event.data.result && event.data.result.c) {
      this.as.setAuthResult(event.data.result);
      this.ds.openSuccessNotification('Logged In', 'Login successful at ' + event.data.result.ip)
      this.dialogRef.close(true);
    }
  }

}
