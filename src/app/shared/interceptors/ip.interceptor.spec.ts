import { TestBed } from '@angular/core/testing';

import { IpInterceptor } from './ip.interceptor';

describe('IpInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      IpInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor: IpInterceptor = TestBed.inject(IpInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
