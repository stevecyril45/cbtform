import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Transaction } from '../../models/Transaction';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly baseUrl: string = environment.api;
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);

  get transactions$(): Observable<Transaction[]> {
    return this.transactionsSubject.asObservable();
  }

  constructor(private http: HttpClient) { }

  /**
   * Get all transactions, using cache if available, otherwise fetch from API.
   */
  getTransactions(): Observable<Transaction[]> {
    if (this.transactionsSubject.value.length > 0) {
      return of(this.transactionsSubject.value);
    } else {
      return this.http.get<Transaction[]>(`${this.baseUrl}/transactions`).pipe(
        tap(transactions => this.transactionsSubject.next(transactions))
      );
    }
  }

  /**
   * Refresh the transactions list from the API.
   */
  refreshTransactions(): void {
    this.http.get<Transaction[]>(`${this.baseUrl}/transactions`).subscribe({
      next: transactions => this.transactionsSubject.next(transactions)
    });
  }

  /**
   * Create a new transaction.
   * @param transactionData Data for the new transaction.
   */
  create(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'token'>): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.baseUrl}/transaction`, transactionData).pipe(
      tap(newTransaction => {
        this.transactionsSubject.next([...this.transactionsSubject.value, newTransaction]);
      })
    );
  }

  /**
   * Get transactions by custom query.
   * @param query Query object with key-value pairs to filter transactions.
   */
  getTransactionsByQuery(query: { [key: string]: string }): Observable<Transaction[]> {
    let params = new HttpParams();
    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        params = params.append(key, query[key]);
      }
    }
    return this.http.get<Transaction[]>(`${this.baseUrl}/transaction`, { params }).pipe(
      tap(transactions => {
        const current = this.transactionsSubject.value;
        const updated = [...current.filter(t => !transactions.some(newT => newT.id === t.id)), ...transactions];
        this.transactionsSubject.next(updated);
      })
    );
  }

  /**
   * Get a transaction by ID or reference query.
   * @param query Query object with id or reference.
   */
  getTransactionByQuery(query: { id?: string; reference?: string }): Observable<Transaction> {
    let params = new HttpParams();
    if (query.id) {
      params = params.append('id', query.id);
    }
    if (query.reference) {
      params = params.append('reference', query.reference);
    }
    return this.http.get<Transaction>(`${this.baseUrl}/transaction`, { params }).pipe(
      tap(transaction => {
        const current = this.transactionsSubject.value;
        const index = current.findIndex(t => t.id === transaction.id);
        if (index !== -1) {
          current[index] = transaction;
          this.transactionsSubject.next([...current]);
        } else {
          this.transactionsSubject.next([...current, transaction]);
        }
      })
    );
  }

  /**
   * Update a transaction by ID.
   * @param id ID of the transaction to update.
   * @param data Partial data to update.
   */
  update(id: string, data: Partial<Transaction>): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.baseUrl}/transaction/${id}`, data).pipe(
      tap(updatedTransaction => {
        const current = this.transactionsSubject.value.map(t => t.id === id ? updatedTransaction : t);
        this.transactionsSubject.next(current);
      })
    );
  }

  /**
   * Delete a transaction by ID.
   * @param id ID of the transaction to delete.
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/transaction/${id}`).pipe(
      tap(() => {
        const current = this.transactionsSubject.value.filter(t => t.id !== id);
        this.transactionsSubject.next(current);
      })
    );
  }
}