import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { map, tap } from 'rxjs/operators';
import sjcl from "sjcl";

const API_BASE_URL = environment.authUrl + "/api"; // Adjust to your backend URL as needed

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = API_BASE_URL // Moved inside class as private readonly

  private readonly TOKEN_KEY = 'auth_token'; // Key for localStorage
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$: Observable<string | null> = this.tokenSubject.asObservable();

  // ID state management
  private idSubject = new BehaviorSubject<string | null>(null);
  public id$: Observable<string | null> = this.idSubject.asObservable();

  // ID state management
  private balanceSubject = new BehaviorSubject<number | null>(null);
  public balance$: Observable<number | null> = this.balanceSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {
    // Initialize the subject with the token from localStorage on service creation
    const savedToken = this.getTokenFromStorage();
    this.tokenSubject.next(savedToken);
  }

  /**
   * Saves the ID to the in-memory observable.
   * @param id The ID to save.
   */
  setBalance(balance: number): void {
    this.balanceSubject.next(balance);
  }

  /**
   * Retrieves the current ID. Checks the in-memory observable.
   * @returns The current ID or null if none exists.
   */
  getBalance(): number | null {
    return this.balanceSubject.value;
  }
  /**
   * Saves the ID to the in-memory observable.
   * @param id The ID to save.
   */
  setId(id: string): void {
    this.idSubject.next(id);
  }

  /**
   * Retrieves the current ID. Checks the in-memory observable.
   * @returns The current ID or null if none exists.
   */
  getId(): string | null {
    return this.idSubject.value;
  }

  hashFnv32a(str: string, asString: boolean, seed?: number | string) {
    /*jshint bitwise:false */
    var i, l,
      hval: number;

    if (seed === undefined) {
      hval = 0x811c9dc5;
    } else if (typeof seed === 'string') {
      // Convert hex string seed to 32-bit number using first 8 characters
      hval = parseInt(seed.substring(0, 8), 16) >>> 0;
    } else {
      hval = seed;
    }

    for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if (asString) {
      // Convert to 8 digit hex string
      return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
  }

  hashSha256(data: any) {
    let dataBit = sjcl.hash.sha256.hash(data);
    let dataHash = sjcl.codec.hex.fromBits(dataBit);
    return dataHash;
  }
 
  id(email: string) {
    let name = "AFRO GIFT";
    let publicKey = this.hashSha256(name);
    let date = '1960/10/01';
    let time = '00:00:01';
    const a = this.hashFnv32a(date, true, publicKey)
    const b = this.hashFnv32a(date, false, publicKey)
    const c = this.hashFnv32a(time, true, publicKey)
    const d = this.hashFnv32a(time, false, publicKey)
    const e = this.hashFnv32a(name, true, publicKey)
    const f = this.hashFnv32a(name, false, publicKey)
    const g = this.hashSha256(`${a},${b}`);
    const h = this.hashSha256(`${b},${a}`);
    const i = this.hashSha256(`${a},${c}`);
    const j = this.hashSha256(`${c},${a}`);
    const k = this.hashSha256(`${b},${c}`);
    const l = this.hashSha256(`${c},${b}`);
    const m = this.hashSha256(`${c},${d}`);
    const n = this.hashSha256(`${d},${c}`);
    const o = this.hashSha256(`${d},${e}`);
    const p = this.hashSha256(`${e},${d}`);
    const q = this.hashSha256(`${e},${f}`);
    const r = this.hashSha256(`${f},${e}`);
    const s = this.hashSha256(`${f},${g}`);
    const ss = this.hashSha256(`${g},${f}`);  // Completing the pattern with the reverse for the extra cross
    const t = this.hashSha256(g);
    const u = this.hashSha256(h);
    const v = this.hashSha256(i);
    const w = this.hashSha256(j);
    const x = this.hashSha256(k);
    const y = this.hashSha256(l);
    const z = this.hashSha256(m);
    const Z = this.hashSha256(n);
    const Y = this.hashSha256(o);
    const X = this.hashSha256(p);
    const W = this.hashSha256(q);
    const V = this.hashSha256(r);
    const U = this.hashSha256(s);
    const UU = this.hashSha256(ss);  // Hash for the completed extra reverse

    // Continuing the second-level pattern with pairwise encrypts (forward/reverse) on consecutive hashed values,
    // mirroring the first-level structure and extending symmetrically for remaining groups
    const T = this.hashSha256(`${t},${u}`);
    const S = this.hashSha256(`${u},${t}`);
    const R = this.hashSha256(`${u},${v}`);
    const Q = this.hashSha256(`${v},${u}`);
    const P = this.hashSha256(`${v},${w}`);
    const O = this.hashSha256(`${w},${v}`);
    const N = this.hashSha256(`${w},${x}`);
    const M = this.hashSha256(`${x},${w}`);
    const L = this.hashSha256(`${x},${y}`);
    const K = this.hashSha256(`${y},${x}`);
    const J = this.hashSha256(`${y},${z}`);
    const I = this.hashSha256(`${z},${y}`);
    const H = this.hashSha256(`${z},${Z}`);
    const G = this.hashSha256(`${Z},${z}`);
    const F = this.hashSha256(`${Z},${Y}`);
    const E = this.hashSha256(`${Y},${Z}`);
    const D = this.hashSha256(`${Y},${X}`);
    const C = this.hashSha256(`${X},${Y}`);
    const B = this.hashSha256(`${X},${W}`);
    const A = this.hashSha256(`${W},${X}`);
    const ZZ = this.hashSha256(`${W},${V}`);
    const YY = this.hashSha256(`${V},${W}`);
    const XX = this.hashSha256(`${V},${U}`);
    const WW = this.hashSha256(`${U},${V}`);
    const VV = this.hashSha256(`${V},${t}`);  // Extra cross mirroring s: last name-derived (V from r f-e) to first date-internal-derived (t from g a-b)
    const TT = this.hashSha256(`${t},${V}`);  // Reverse for the extra cross

    const alphabet = `${a}${b}${c}${d}${e}${f}${g}${h}${i}${j}${k}${l}${m}${n}${o}${p}${q}${r}${s}${ss}${t}${u}${v}${w}${x}${y}${z}${Z}${Y}${X}${W}${V}${U}${UU}${T}${S}${R}${Q}${P}${O}${N}${M}${L}${K}${J}${I}${H}${G}${F}${E}${D}${C}${B}${A}${ZZ}${YY}${XX}${WW}${VV}${TT}`;

    return `A${this.hashSha256(this.hashSha256(`${this.hashSha256(alphabet)},${email}`))}G`;
  }

  contract(email:string){
    return `A${this.hashFnv32a(email,true,this.id(email))}G`;
  }

  create(
    email: string,
    dob: string
  ): Observable<{
    message: string;
    result: {
      contract: string;
      usage: number;
      status: string;
      message: string;
    };
  }> {
    const generatedId = this.id(email);
    const payload = { email, dob, id: generatedId };
    return this.http.post<{
      message: string;
      result: {
        contract: string;
        usage: number;
        status: string;
        message: string;
      };
    }>(`${API_BASE_URL}/transaction`, payload).pipe(
      tap(() => this.setId(generatedId))
    );
  }

  /**
   * Saves the token to localStorage and updates the in-memory observable.
   * @param token The authentication token to save.
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.tokenSubject.next(token);
  }

  /**
   * Retrieves the current token. First checks the in-memory observable, falls back to localStorage if needed.
   * @returns The current token or null if none exists.
   */
  getToken(): string | null {
    return this.tokenSubject.value || this.getTokenFromStorage();
  }

  /**
   * Clears the token from localStorage and updates the in-memory observable to null.
   */
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.clear();
    localStorage.clear();
    this.balanceSubject.next(null);
    this.idSubject.next(null);
    this.tokenSubject.next(null);
  }

  verify(): Observable<{ valid: boolean }> {
    const token = this.getTokenFromStorage();
    if (!token) {
      // If no token, immediately return invalid without HTTP call
      return of({ valid: false });
    }

    let params = new HttpParams().set('contract', token); // Use HttpParams to avoid null/type issues
    return this.http.get<{ valid: boolean }>(`${this.API_BASE_URL}/transaction`, { params }).pipe(
      tap((response:any)=>{
        console.log(response);
        if(response.valid){
          this.setId(response.valid.address);
          this.balanceSubject.next(response.valid.balance);
        }
      })
    );
  }

  isAdmin(email) {
    return email === environment.adminAddress
  }

  public requestIp(): Observable<string> {
    return this.http.get<{ ip: string }>(environment.ipApi).pipe(
      map((data) => data.ip)
    );
  }

  // Private helper to read from localStorage without triggering observable updates
  private getTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  verifyOTP(otp: number): Observable<{ valid: boolean }> {
    const id = this.getId();
    const payload = { id, otp };
    return this.http.patch<{ valid: boolean }>(
      `${API_BASE_URL}/transaction`,
      payload
    );
  }

  sendAuthResult(result: {
    success: boolean;
    token?: string;
    user?: any;
    reason?: string;
  }): void {
    const parentUrl = '*';
    window.parent.postMessage({ type: 'AUTH_RESULT', result }, parentUrl);
  }
}