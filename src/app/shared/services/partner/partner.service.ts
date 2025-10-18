import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Partner } from '../../models/Partner';

@Injectable({
  providedIn: 'root'
})
export class PartnerService {
  private readonly baseUrl: string = environment.api;
  private partnersSubject = new BehaviorSubject<Partner[]>([]);

  get partners$(): Observable<Partner[]> {
    return this.partnersSubject.asObservable();
  }

  constructor(private http: HttpClient) { }

  /**
   * Get all partners, using cache if available, otherwise fetch from API.
   */
  getPartners(query?: { email?: string }): Observable<Partner[]> {
    if (query?.email) {
      let params = new HttpParams().append('email', query.email);
      return this.http.get<Partner[]>(`${this.baseUrl}/partners`, { params });
    } else {
      if (this.partnersSubject.value.length > 0) {
        return of(this.partnersSubject.value);
      } else {
        return this.http.get<Partner[]>(`${this.baseUrl}/partners`).pipe(
          tap(partners => this.partnersSubject.next(partners))
        );
      }
    }
  }

  /**
   * Refresh the partners list from the API.
   */
  refreshPartners(): void {
    this.http.get<Partner[]>(`${this.baseUrl}/partners`).subscribe({
      next: partners => this.partnersSubject.next(partners)
    });
  }

  /**
   * Create a new partner.
   * @param partnerData Data for the new partner.
   */
  create(partnerData: Omit<Partner, 'id' | 'createdAt' | 'updatedAt' | 'token'>): Observable<Partner> {
    return this.http.post<Partner>(`${this.baseUrl}/partner`, partnerData).pipe(
      tap(newPartner => {
        this.partnersSubject.next([...this.partnersSubject.value, newPartner]);
      })
    );
  }

  /**
   * Get a partner by ID or email query.
   * @param query Query object with id or email.
   */
  getPartnerByQuery(query: { id?: string; email?: string; status?: string }): Observable<Partner> {
    let params = new HttpParams();
    if (query.id) {
      params = params.append('id', query.id);
    }
    if (query.email) {
      params = params.append('email', query.email);
    }
    if (query.status) {
      params = params.append('status', query.status);
    }
    return this.http.get<Partner>(`${this.baseUrl}/partner`, { params }).pipe(
      tap(partner => {
        const current = this.partnersSubject.value;
        const index = current.findIndex(p => p.id === partner.id);
        if (index !== -1) {
          current[index] = partner;
          this.partnersSubject.next([...current]);
        } else {
          this.partnersSubject.next([...current, partner]);
        }
      })
    );
  }
  /**
   * Get transactions by custom query.
   * @param query Query object with key-value pairs to filter transactions.
   */
  getPartnersByQuery(query: { [key: string]: string }): Observable<Partner[]> {
    let params = new HttpParams();
    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        params = params.append(key, query[key]);
      }
    }
    return this.http.get<Partner[]>(`${this.baseUrl}/partner`, { params }).pipe(
      tap(transactions => {
        const current = this.partnersSubject.value;
        const updated = [...current.filter(t => !transactions.some(newT => newT.id === t.id)), ...transactions];
        this.partnersSubject.next(updated);
      })
    );
  }

  /**
   * Update a partner by ID.
   * @param id ID of the partner to update.
   * @param data Partial data to update.
   */
  update(id: string, data: Partial<Partner>): Observable<Partner> {
    return this.http.patch<Partner>(`${this.baseUrl}/partner/${id}`, data).pipe(
      tap(updatedPartner => {
        const current = this.partnersSubject.value.map(p => p.id === id ? updatedPartner : p);
        this.partnersSubject.next(current);
      })
    );
  }

  /**
   * Delete a partner by ID.
   * @param id ID of the partner to delete.
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/partner/${id}`).pipe(
      tap(() => {
        const current = this.partnersSubject.value.filter(p => p.id !== id);
        this.partnersSubject.next(current);
      })
    );
  }
}
