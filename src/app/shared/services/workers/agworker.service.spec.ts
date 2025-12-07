import { TestBed } from '@angular/core/testing';

import { AGWorkerService } from './agworker.service';

describe('AGWorkerService', () => {
  let service: AGWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AGWorkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
