import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AGWorkerService } from '../shared/services/workers/agworker.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  welcomeMessage = '';

  constructor(private agWorker: AGWorkerService) {

  }

  async loadWelcome() {
    try {
      this.welcomeMessage = await this.agWorker.welcome();
      // Try typing, scrolling, opening dev tools → everything stays SMOOTH!
    } catch (err) {
      this.welcomeMessage = 'Failed to connect to AG Network';
    }
  }

  ngOnInit(): void {
    this.loadWelcome();
  }



}
