import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Interface for Session
interface Session {
  email: string;
  isFirstTimeUser: boolean;
  ip: string;
  user_agent: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  browser: string;
  deviceOrientation: string;
  created_at: string;
  expires_at: string;
  status: string;
  token: string;
}

// Interface for API
interface Api {
  name: string;
  websiteUrl: string;
  successUrl: string;
  errorUrl: string;
  logoUrl: string;
  Abv: string;
  totalLoginAttempt: number;
  totalLoginSuccess: number;
  totalLoginFailure: number;
  totalNewly: number;
  created_at: string;
}

// Interface for Auth
interface Auth {
  email: string;
  isFirstTimeUser: boolean;
  ip: string;
  user_agent: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  browser: string;
  deviceOrientation: string;
  apikey: string;
  created_at: string;
  session: Session[];
  status: number;
  current: string;
  verify_sign: number;
  updated_at: string;
  api: Api[];
}

// Interface for User Data
interface UserData {
  type: string;
  auth: Auth;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // BehaviorSubject to maintain user state
  private userSubject: BehaviorSubject<UserData | null> = new BehaviorSubject<UserData | null>(null);
  // Observable for components to subscribe to
  public user$: Observable<UserData | null> = this.userSubject.asObservable();

  // Key for sessionStorage
  private readonly STORAGE_KEY = 'user_data';

  constructor() {
    // Initialize by loading data from sessionStorage
    this.loadFromStorage();
  }

  /**
   * Saves user data to sessionStorage and updates BehaviorSubject
   * @param userData The user data to save
   */
  saveUserData(userData: UserData): void {
    try {
      // Save to sessionStorage
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
      // Update BehaviorSubject
      this.userSubject.next(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  /**
   * Retrieves user data from sessionStorage
   * @returns The user data or null if not found
   */
  getUserData(): UserData | null {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  /**
   * Loads user data from sessionStorage on initialization
   */
  private loadFromStorage(): void {
    const storedData = this.getUserData();
    console.log(storedData)
    if (storedData) {
      this.userSubject.next(storedData);
    }
  }
  clearSession(){
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Logs out the user by clearing sessionStorage and resetting BehaviorSubject
   */
  logout(): void {
    try {
      // Clear sessionStorage
      sessionStorage.removeItem(this.STORAGE_KEY);
      // Reset BehaviorSubject
      this.userSubject.next(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Gets the current user data from BehaviorSubject
   * @returns The current user data or null
   */
  getCurrentUser(): UserData | null {
    return this.userSubject.getValue();
  }
}
