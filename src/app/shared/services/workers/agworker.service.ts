// src/app/services/ag-worker.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AGWorkerService {

  welcome(): Promise<string> {
    console.log('%c[AGWorkerService] Initializing AG Network welcome...', 'color: #8b5cf6; font-weight: bold');

    return new Promise((resolve, reject) => {
      const worker = new Worker('./assets/workers/welcome.worker.js', { type: 'module' });
      console.log('%c[AGWorkerService] Web Worker started in background', 'color: #10b981');

      worker.onmessage = (e) => {
        const data = e.data;

        if (data.type === 'welcome') {
          const fullMessage = `${data.message} | Powered by ${data.poweredBy}`;
          console.log('%cSuccess: ' + fullMessage, 'color: #10b981; font-size: 16px; font-weight: bold');
          resolve(fullMessage);
        }

        worker.terminate();
      };

      worker.onerror = (err) => {
        console.error('Worker failed', err);
        reject(err);
        worker.terminate();
      };

      // Trigger the welcome
      worker.postMessage('start');
    });
  }
}
