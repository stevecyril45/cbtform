import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Define interfaces for response types based on Paystack API
interface Bank {
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

interface BankResponse {
  status: boolean;
  message: string;
  data: Bank[];
  meta: {
    next: string | null;
    previous: string | null;
    perPage: number;
  };
}

interface Country {
  id: number;
  name: string;
  iso_code: string;
  default_currency_code: string;
  integration_defaults: Record<string, any>;
  relationships: {
    currency: { type: string; data: string[] };
    integration_feature: { type: string; data: string[] };
    integration_type: { type: string; data: string[] };
    payment_method: { type: string; data: string[] };
  };
}

interface CountryResponse {
  status: boolean;
  message: string;
  data: Country[];
}

interface State {
  name: string;
  slug: string;
  abbreviation: string;
}

interface StateResponse {
  status: boolean;
  message: string;
  data: State[];
}

@Injectable({
  providedIn: 'root',
})
export class PaystackService {
  private apiUrl = 'https://api.paystack.co';
  private secretKey: string = environment.paystack;

  constructor(private http: HttpClient) {}

  // Helper to create headers with Authorization
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.secretKey}`,
    });
  }

  // Fetch list of banks with optional query parameters
  getBanks(params: {
    country?: string;
    use_cursor?: boolean;
    perPage?: number;
    pay_with_bank_transfer?: boolean;
    pay_with_bank?: boolean;
    enabled_for_verification?: boolean;
    next?: string;
    previous?: string;
    gateway?: string;
    type?: string;
    currency?: string;
    include_nip_sort_code?: boolean;
  } = {}): Observable<BankResponse> {
    let queryParams = new HttpParams();
    if (params.country) queryParams = queryParams.set('country', params.country);
    if (params.use_cursor) queryParams = queryParams.set('use_cursor', params.use_cursor.toString());
    if (params.perPage) queryParams = queryParams.set('perPage', params.perPage.toString());
    if (params.pay_with_bank_transfer)
      queryParams = queryParams.set('pay_with_bank_transfer', params.pay_with_bank_transfer.toString());
    if (params.pay_with_bank) queryParams = queryParams.set('pay_with_bank', params.pay_with_bank.toString());
    if (params.enabled_for_verification)
      queryParams = queryParams.set('enabled_for_verification', params.enabled_for_verification.toString());
    if (params.next) queryParams = queryParams.set('next', params.next);
    if (params.previous) queryParams = queryParams.set('previous', params.previous);
    if (params.gateway) queryParams = queryParams.set('gateway', params.gateway);
    if (params.type) queryParams = queryParams.set('type', params.type);
    if (params.currency) queryParams = queryParams.set('currency', params.currency);
    if (params.include_nip_sort_code)
      queryParams = queryParams.set('include_nip_sort_code', params.include_nip_sort_code.toString());

    return this.http.get<BankResponse>(`${this.apiUrl}/bank`, {
      headers: this.getHeaders(),
      params: queryParams,
    });
  }

  // Fetch list of supported countries
  getCountries(): Observable<CountryResponse> {
    return this.http.get<CountryResponse>(`${this.apiUrl}/country`, {
      headers: this.getHeaders(),
    });
  }

  // Fetch list of states for address verification
  getStates(countryCode: string): Observable<StateResponse> {
    const params = new HttpParams().set('country', countryCode);
    return this.http.get<StateResponse>(`${this.apiUrl}/address_verification/states`, {
      headers: this.getHeaders(),
      params,
    });
  }
}
