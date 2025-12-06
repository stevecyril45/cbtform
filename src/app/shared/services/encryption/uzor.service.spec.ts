import { TestBed } from '@angular/core/testing';

import { UzorService } from './uzor.service';

describe('UzorService', () => {
  let service: UzorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UzorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
