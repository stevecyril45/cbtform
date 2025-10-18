import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Card } from '../../models/Card';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private readonly baseUrl: string = environment.api;
  private cardsSubject = new BehaviorSubject<Card[]>([]);

  get cards$(): Observable<Card[]> {
    return this.cardsSubject.asObservable();
  }

  constructor(private http: HttpClient) { }

  /**
   * Get all cards, using cache if available, otherwise fetch from API.
   */
  getCards(query?: { email?: string }): Observable<Card[]> {
    let params = new HttpParams();
    if (!query) {
      if (this.cardsSubject.value.length > 0) {
        return of(this.cardsSubject.value);
      } else {
        return this.http.get<Card[]>(`${this.baseUrl}/giftcards`).pipe(
          tap(cards => this.cardsSubject.next(cards))
        );
      }
    }
    if (query.email) {
      params = params.append('email', query.email);
      return this.http.get<Card[]>(`${this.baseUrl}/giftcards`).pipe(
        tap(cards => this.cardsSubject.next(cards))
      );
    }else{
      if (this.cardsSubject.value.length > 0) {
        return of(this.cardsSubject.value);
      } else {
        return this.http.get<Card[]>(`${this.baseUrl}/giftcards`).pipe(
          tap(cards => this.cardsSubject.next(cards))
        );
      }
    }
  }

  /**
   * Refresh the cards list from the API.
   */
  refreshCards(): void {
    this.http.get<Card[]>(`${this.baseUrl}/giftcards`).subscribe({
      next: cards => this.cardsSubject.next(cards)
    });
  }

  /**
   * Create a new card.
   * @param cardData Data for the new card.
   */
  create(cardData: Omit<Card, 'id' | 'createdAt' | 'updatedAt' | 'token'>): Observable<Card> {
    return this.http.post<Card>(`${this.baseUrl}/giftcard`, cardData).pipe(
      tap(newCard => {
        this.cardsSubject.next([...this.cardsSubject.value, newCard]);
      })
    );
  }
     
    getCardByQuery(query: { [key: string]: string }): Observable<Card> {
      let params = new HttpParams();
      for (const key in query) {
        if (query.hasOwnProperty(key)) {
          params = params.append(key, query[key]);
        }
      }
      return this.http.get<Card>(`${this.baseUrl}/giftcard`, { params });
    }
 
    getCardsByQuery(query: { [key: string]: string }): Observable<Card[]> {
      let params = new HttpParams();
      for (const key in query) {
        if (query.hasOwnProperty(key)) {
          params = params.append(key, query[key]);
        }
      }
      return this.http.get<Card[]>(`${this.baseUrl}/giftcard`, { params });
    }

  

  /**
   * Update a card by ID.
   * @param id ID of the card to update.
   * @param data Partial data to update.
   */
  update(id: string, data: Partial<Card>): Observable<Card> {
    return this.http.patch<Card>(`${this.baseUrl}/giftcard/${id}`, data).pipe(
      tap(updatedCard => {
        const current = this.cardsSubject.value.map(c => c.id === id ? updatedCard : c);
        this.cardsSubject.next(current);
      })
    );
  }

  /**
   * Delete a card by ID.
   * @param id ID of the card to delete.
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/giftcard/${id}`).pipe(
      tap(() => {
        const current = this.cardsSubject.value.filter(c => c.id !== id);
        this.cardsSubject.next(current);
      })
    );
  }
}