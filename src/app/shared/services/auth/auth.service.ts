import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import sjcl from 'sjcl';
import { UzorService } from '../encryption/uzor.service';

const API_BASE_URL = environment.authUrl + '/api';

export interface AuthResult {
  success?: boolean;
  message?: string;
  contract?: string;
  address?: string;

  // New minimal response from backend
  a?: string;  // address
  c?: string;  // contract
  d?: string;  // dob (via UzorService.dob)
  s?: boolean; // success flag
  i?: string;  // user IP
  t?: string;  // timestamp
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_state_final';

  // Only the fields we actually use now
  private _a = new BehaviorSubject<string | null>(null); // address
  private _c = new BehaviorSubject<string | null>(null); // contract
  private _d = new BehaviorSubject<string | null>(null); // dob hash
  private _i = new BehaviorSubject<string | null>(null); // IP
  private _t = new BehaviorSubject<string | null>(null); // timestamp
  private _s = new BehaviorSubject<boolean>(false);      // authenticated?

  // Public observables
  public a$: Observable<string | null> = this._a.asObservable();
  public c$: Observable<string | null> = this._c.asObservable();
  public d$: Observable<string | null> = this._d.asObservable();
  public i$: Observable<string | null> = this._i.asObservable();
  public t$: Observable<string | null> = this._t.asObservable();
  public isAuthenticated$: Observable<boolean> = this._s.asObservable();

  // Getters
  public get a() { return this._a.value; }
  public get c() { return this._c.value; }
  public get d() { return this._d.value; }
  public get i() { return this._i.value; }
  public get t() { return this._t.value; }
  public get isAuthenticated() { return this._s.value; }

  constructor(
    private http: HttpClient,
    private uzor: UzorService
  ) {
    this.loadFromStorage();
  }

  // === PRIVATE: Fetch real IP ===
  private getIpWithInternet(): Observable<{ ip: string }> {
    return this.http.get<{ ip: string }>(environment.ipApi).pipe(
      switchMap(res => of({ ip: res.ip }))
    );
  }

  // === CREATE ACCOUNT (unchanged logic) ===
  create(email: string, dob: string): Observable<AuthResult> {
    const generatedAddress = this.id(email);

    return this.getIpWithInternet().pipe(
      switchMap(({ ip }) => {
        const data = { email, dob, address: generatedAddress };
        const encryptedFields: any = {};
        const originals: string[] = [];

        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            const val = String(data[key] ?? 'null');
            encryptedFields[key] = this.uzor.encode(val).data;
            originals.push(val);
          }
        }

        const masterSecret = originals.join('||UZOR||');
        const masterProof = this.uzor.encrypt(masterSecret);

        const payload = {
          ...encryptedFields,
          _p: masterProof,
          _h: masterProof.h,
          _c: masterProof.c,
          _pr: Object.keys(data)
        };

        return this.http.post<AuthResult>(`${API_BASE_URL}/transaction`, payload, {
          headers: { ip }
        });
      })
    );
  }

  // === VERIFY OTP — Now sets auth state on success ===
  verifyOTP(email: string, contract: string, otp: string): Observable<AuthResult> {
    const address = this.id(email);

    return this.getIpWithInternet().pipe(
      switchMap(({ ip }) => {
        const reason = 'verifyOTP';
        const data = { address, contract, reason, otp: otp.toString() };
        const encryptedFields: any = {};
        const originals: string[] = [];

        for (const key in data) {
          const val = String(data[key]);
          encryptedFields[key] = this.uzor.encode(val).data;
          originals.push(val);
        }

        const masterSecret = originals.join('||UZOR||');
        const masterProof = this.uzor.encrypt(masterSecret);

        const payload = {
          ...encryptedFields,
          _p: masterProof,
          _h: masterProof.h,
          _c: masterProof.c,
          _pr: Object.keys(data)
        };

        return this.http.patch<AuthResult>(`${API_BASE_URL}/transaction`, payload, {
          headers: { ip }
        });
      }),
      tap((result: any) => {
        if (result?.success === true) {
          this.setAuthResult(result.data);
        }
      })
    );
  }

  // === SET AUTH STATE FROM BACKEND RESULT ===
  setAuthResult(result: AuthResult): void {
    console.log(result);
    if (!result?.s) {
      this.logout();
      return;
    }

    this._a.next(result.a || null);
    this._c.next(result.c || null);
    this._d.next(result.d || null);
    this._i.next(result.i || null);
    this._t.next(result.t || null);
    this._s.next(true);

    this.saveToStorage();
    this.sendAuthResult(result); // Optional: notify parent window (iframe use)
  }

  // === LOGOUT ===
  logout(): void {
    this._a.next(null);
    this._c.next(null);
    this._d.next(null);
    this._i.next(null);
    this._t.next(null);
    this._s.next(false);
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.clear();
  }

  // === PERSISTENCE ===
  private saveToStorage(): void {
    const state = {
      a: this._a.value,
      c: this._c.value,
      d: this._d.value,
      i: this._i.value,
      t: this._t.value,
      s: this._s.value,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;

    try {
      const state = JSON.parse(raw);
      this._a.next(state.a || null);
      this._c.next(state.c || null);
      this._d.next(state.d || null);
      this._i.next(state.i || null);
      this._t.next(state.t || null);
      this._s.next(!!state.s);
    } catch (e) {
      console.warn('Corrupted auth state, clearing...');
      this.logout();
    }
  }

  // === CRYPTO HELPERS (unchanged) ===
  id(email: string): string {
    const _f = "AFRO"; const father = this.hashSha256(_f);
    const _s = ' '; const space = this.hashSha256(_s);
    const _m = "GIFT"; const mother = this.hashSha256(_m);
    const name = `${father}${space}${mother}`;
    const publicKey = this.hashSha256(name);
    const one = this.hashSha256('1');
    const nine = this.hashSha256('9');
    const six = this.hashSha256('6');
    const zero = this.hashSha256('0');
    const slash = this.hashSha256('/');
    const col = this.hashSha256(':');
    const date = `${one}${nine}${six}${zero}${slash}${one}${zero}${slash}${zero}${one}`;
    const dateHash = this.hashSha256(date);
    const time = `${zero}${zero}${col}${zero}${zero}${col}${zero}${one}`;
    const timeHash = this.hashSha256(time);
    const format = `${publicKey}${space}${dateHash}${space}${timeHash}`;

    const a = this.hashSha256(`${format}a${format}`);
    const b = this.hashSha256(`${format}b${format}`);
    const c = this.hashSha256(`${format}c${format}`);
    const d = this.hashSha256(`${format}d${format}`);
    const e = this.hashSha256(`${format}e${format}`);
    const f = this.hashSha256(`${format}f${format}`);
    const rest = this.hashSha256(`${format}${space}${format}`);
    const g = this.hashSha256(`${a}${space}${b}`);
    const h = this.hashSha256(`${b}${space}${a}`);
    const i = this.hashSha256(`${a}${space}${c}`);
    const j = this.hashSha256(`${c}${space}${a}`);
    const k = this.hashSha256(`${b}${space}${c}`);
    const l = this.hashSha256(`${c}${space}${b}`);
    const m = this.hashSha256(`${c}${space}${d}`);
    const n = this.hashSha256(`${d}${space}${c}`);
    const o = this.hashSha256(`${d}${space}${e}`);
    const p = this.hashSha256(`${e}${space}${d}`);
    const q = this.hashSha256(`${e}${space}${f}`);
    const r = this.hashSha256(`${f}${space}${e}`);
    const s = this.hashSha256(`${f}${space}${g}`);
    const ss = this.hashSha256(`${g}${space}${f}`);
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
    const UU = this.hashSha256(ss);

    const T = this.hashSha256(`${t}${space}${u}`);
    const S = this.hashSha256(`${u}${space}${t}`);
    const R = this.hashSha256(`${u}${space}${v}`);
    const Q = this.hashSha256(`${v}${space}${u}`);
    const P = this.hashSha256(`${v}${space}${w}`);
    const O = this.hashSha256(`${w}${space}${v}`);
    const N = this.hashSha256(`${w}${space}${x}`);
    const M = this.hashSha256(`${x}${space}${w}`);
    const L = this.hashSha256(`${x}${space}${y}`);
    const K = this.hashSha256(`${y}${space}${x}`);
    const J = this.hashSha256(`${y}${space}${z}`);
    const I = this.hashSha256(`${z}${space}${y}`);
    const H = this.hashSha256(`${z}${space}${Z}`);
    const G = this.hashSha256(`${Z}${space}${z}`);
    const F = this.hashSha256(`${Z}${space}${Y}`);
    const E = this.hashSha256(`${Y}${space}${Z}`);
    const D = this.hashSha256(`${Y}${space}${X}`);
    const C = this.hashSha256(`${X}${space}${Y}`);
    const B = this.hashSha256(`${X}${space}${W}`);
    const A = this.hashSha256(`${W}${space}${X}`);
    const ZZ = this.hashSha256(`${W}${space}${V}`);
    const YY = this.hashSha256(`${V}${space}${W}`);
    const XX = this.hashSha256(`${V}${space}${U}`);
    const WW = this.hashSha256(`${U}${space}${V}`);
    const VV = this.hashSha256(`${V}${space}${t}`);
    const TT = this.hashSha256(`${t}${space}${V}`);

    const alphabet = `${a}${space}${b}${space}${c}${space}${d}${space}${e}${space}${f}${space}${g}${space}${h}${space}${i}${space}${j}${space}${k}${space}${l}${space}${m}${space}${n}${space}${o}${space}${p}${space}${q}${space}${r}${space}${s}${space}${ss}${space}${t}${space}${u}${space}${v}${space}${w}${space}${x}${space}${y}${space}${z}${space}${Z}${space}${Y}${space}${X}${space}${W}${space}${V}${space}${U}${space}${UU}${space}${T}${space}${S}${space}${R}${space}${Q}${space}${P}${space}${O}${space}${N}${space}${M}${space}${L}${space}${K}${space}${J}${space}${I}${space}${H}${space}${G}${space}${F}${space}${E}${space}${D}${space}${C}${space}${B}${space}${A}${space}${ZZ}${space}${YY}${space}${XX}${space}${WW}${space}${VV}${space}${TT}`;

    return this.uzor.hashSha256(`A${rest}${this.hashSha256(this.hashSha256(`${this.hashSha256(alphabet)}${space}${email}`))}${rest}G`);
  }

  hashSha256(data: any): string {
    const bits = sjcl.hash.sha256.hash(data);
    return sjcl.codec.hex.fromBits(bits);
  }

  hashFnv32a(str: string, asString: boolean, seed?: number | string): any {
    let hval: number = seed === undefined ? 0x811c9dc5 :
      (typeof seed === 'string' ? parseInt(seed.substring(0, 8), 16) >>> 0 : seed);

    for (let i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if (asString) {
      return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
  }

  // Optional: lightweight session check
  verify(): Observable<{ valid: boolean }> {
    const contract = this.c;
    console.log(contract);
    if (!contract) return of({ valid: false });

    return this.http.get<{ valid: boolean }>(`${API_BASE_URL}/transaction`, {
      params: new HttpParams().set('contract', contract)
    });
  }

  isAdmin(email: string): boolean {
    return email === environment.adminAddress;
  }

  sendAuthResult(result: AuthResult): void {
    window.parent.postMessage({ type: 'AUTH_RESULT', result }, '*');
  }
}