import { Component, ElementRef,ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/user/user.service';
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
  authSuccess = false;

  constructor(
    public dialogRef: MatDialogRef<AuthComponent>,
    private sanitizer: DomSanitizer,
    private userService: UserService,
    private as: AuthService,
    private ds: DeviceService
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
    //   {
    //     "type": "AUTH_RESULT",
    //     "result": {
    //         "success": true,
    //         "token": "9d73f7cc1aa80bba1acc3c8c3b8b5dc55323e12b77b99180faed2ce0eba8223a",
    //         "user": "somtobuchi@gmail.com",
    //         "reason": "OTP verified and usage updated successfully"
    //     }
    // }
    if (event.data.result.token && event.data.result.user) {
      this.as.setToken(event.data.result.token);
      this.as.setId(event.data.result.user);
      this.ds.openSuccessNotification('Logged In', 'Login successful by ' + event.data.result.user);
      this.authSuccess = true;
      this.dialogRef.close(true);
    }
  }
}