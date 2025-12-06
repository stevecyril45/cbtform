// src/app/services/uzor.service.ts
import { Injectable } from '@angular/core';
import sjcl from 'sjcl';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UzorService {
  key: any = environment.pub_key;

  // Universal character set — exactly matches backend
  private alphabet = "abcdefghijklmnopqrstuvwxyz";
  private ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  private number = "0123456789";
  private sign = `.~!@#$%^&*()-_=+[]{}|/?<>'',`;
  private space = " ";
  private universal = this.space + this.sign + this.alphabet + this.ALPHABET + this.number;

  // Precomputed maps: char → hash and hash → char
  private charToHash = new Map<string, string>();
  private hashToChar = new Map<string, string>();

  // Sacred constant — length of universal charset
  private readonly FUTURE = this.universal.length; // 91

  // Offset: milliseconds from Year 1 AD (0001-01-01) to Unix epoch
  private readonly YEAR_ONE_OFFSET = 62167219200000n; // BigInt

  constructor() {
    this._buildMaps();
  }

  // Build lookup tables once
  private _buildMaps() {
    if (this.charToHash.size > 0) return;
    for (const ch of this.universal) {
      const h = this.hashSha256(ch);
      this.charToHash.set(ch, h);
      this.hashToChar.set(h, ch);
    }
  }
  connect(ip:any, internet:any){
    return internet == this.internet(ip,this.contract(this.getIp()));
  }
    getIp() {

      return environment.serverAddress;
    }
    internet(client:string, target:string){
      const ip = this.getIp();
      const serverContract = this.contract(ip);
      if(target !== serverContract){
        return '';
      }
      return this.contract(client) +"." + this.contract(serverContract);
    }

  // ===================================================================
  // CORE: SHA-256 (identical to backend)
  // ===================================================================
  hashSha256(data: string | number | bigint): string {
    const bits = sjcl.hash.sha256.hash(String(data));
    return sjcl.codec.hex.fromBits(bits);
  }

  // ===================================================================
  // 1. Nuclear Fingerprint — public h & c
  // ===================================================================
  hash(data: any): any {
    const dataStr = String(data);
    const format: any = { h: "", c: "" };
    const lengthHash = this.hashSha256(String(dataStr.length));
    format.c = lengthHash;

    const getPositions = (char: string): number[] => {
      const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = dataStr.matchAll(new RegExp(escaped, 'g'));
      const pos: number[] = [];
      for (const m of matches) pos.push(m.index!);
      return pos;
    };

    const blocks: any[] = [];

    for (const ch of this.universal) {
      const positions = getPositions(ch);
      const count = positions.length;
      const sum = positions.reduce((a, b) => a + b, 0);
      const concat = positions.join("");

      const chHash = this.hashSha256(ch);
      const key = (ch === "h" || ch === "c") ? `_${ch}` : ch;

      const block = {
        h: chHash,
        t: this.hashSha256(String(count) + chHash),
        is: this.hashSha256(String(sum) + chHash),
        ic: this.hashSha256(concat + chHash),
      };

      format[key] = block;
      blocks.push(block);
    }

    // Nuclear avalanche
    let avalanche = dataStr + dataStr.length;
    blocks.forEach(b => avalanche += b.h + b.t + b.is + b.ic);
    const final = this.hashSha256(avalanche);

    format.h = this.hashSha256(dataStr + final);
    format.c = this.hashSha256(String(dataStr.length) + final);
    format.h = this.hashSha256(format.h + format.c);

    return format;
  }

  // ===================================================================
  // 2. Reversible Encoding (client-side only)
  // ===================================================================
  encode(data: string): { h: string; c: string; data: string } {
    const fp = this.hash(data);
    const parts: string[] = [];

    for (const ch of data) {
      const h = this.charToHash.get(ch) ?? this.hashSha256(ch);
      parts.push(h);
    }

    return {
      h: fp.h,
      c: fp.c,
      data: parts.join("")
    };
  }

  // ===================================================================
  // 3. Decode — only client can recover
  // ===================================================================
  decode(encodedData: string): string {
    const result: string[] = [];
    const chunk = 64;

    for (let i = 0; i < encodedData.length; i += chunk) {
      const slice = encodedData.substr(i, chunk);
      const ch = this.hashToChar.get(slice) ?? "?";
      result.push(ch);
    }
    return result.join("");
  }

  // ===================================================================
  // 4. Zero-Knowledge Proof (encrypt) — server verifies without plaintext
  // ===================================================================
  encrypt(data: string): any {
    const dataStr = String(data);
    const lengthHash = this.hashSha256(String(dataStr.length));

    const format: any = {
      h: this.hashSha256(dataStr),
      c: lengthHash,
    };

    const getPositions = (char: string): number[] => {
      const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = dataStr.matchAll(new RegExp(escaped, 'g'));
      const pos: number[] = [];
      for (const m of matches) pos.push(m.index!);
      return pos;
    };

    for (const ch of this.universal) {
      const positions = getPositions(ch);
      const count = positions.length;
      const sum = positions.reduce((a, b) => a + b, 0);
      const concat = positions.join("");

      const chHash = this.hashSha256(ch);
      const key = (ch === "h" || ch === "c") ? `_${ch}` : ch;

      format[key] = {
        h: chHash,
        c: this.hashSha256(`C|${ch}|${lengthHash}|${count}`),
        is: this.hashSha256(`IS|${ch}|${lengthHash}|${sum}`),
        ic: this.hashSha256(`IC|${ch}|${lengthHash}|${concat}`),
      };
    }

    return format;
  }

  // ===================================================================
  // 5. Verify — server proves knowledge without revealing data
  // ===================================================================
  verify(plain: string, cipher: any): boolean {
    try {
      const test = this.encrypt(plain);
      if (test.h !== cipher.h || test.c !== cipher.c) return false;

      for (const ch of this.universal) {
        const key = (ch === "h" || ch === "c") ? `_${ch}` : ch;
        if (!cipher[key] || !test[key]) return false;
        if (test[key].h !== cipher[key].h) return false;
        if (test[key].c !== cipher[key].c) return false;
        if (test[key].is !== cipher[key].is) return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // ===================================================================
  // IP Contract — A...G address + DOB → identity proof
  // ===================================================================
  ip(address: string, dob: string): string {
    if (typeof address !== 'string' || typeof dob !== 'string') return '';
    address = address.trim();
    dob = dob.trim();

    if (!address.startsWith('A') || !address.endsWith('G')) return '';

    const combined = address + dob;

    const digitCount = Array(10).fill(0);
    const letterCount: Record<string, number> = {};

    for (const ch of combined) {
      if (ch >= '0' && ch <= '9') {
        digitCount[Number(ch)]++;
      } else if (/[a-zA-Z]/.test(ch)) {
        letterCount[ch] = (letterCount[ch] || 0) + 1;
      }
    }

    const parts: string[] = [];

    // 0–9
    for (let i = 0; i <= 9; i++) {
      parts.push(`${i}.${digitCount[i]}`);
    }

    // Structural A
    parts.push('A.1');

    // a–z
    for (let i = 97; i <= 122; i++) {
      const ch = String.fromCharCode(i);
      parts.push(`${ch}.${letterCount[ch] || 0}`);
    }

    // B–Z (skip A)
    for (let i = 66; i <= 90; i++) {
      const ch = String.fromCharCode(i);
      if (ch === 'A') continue;
      let count = letterCount[ch] || 0;
      if (ch === 'G') count = Math.max(0, count - 1);
      parts.push(`${ch}.${count}`);
    }

    // Structural final G
    parts.push('1.G');

    return parts.join('.');
  }

  contract(ip: string): string {
    return `${this.hashSha256('U')}${this.hashSha256(ip)}${this.hashSha256('G')}`;
  }

  // ===================================================================
  // DOB — Eternal Soul Signature (Year 1 AD = 0)
  // ===================================================================
  dob(dob: string): string {
    if (!this.validformat(dob)) {
      throw new Error(`DOB must be in format YYYY/MM/DD/HH/mm/ss`);
    }

    const future = this.FUTURE; // 91

    const [year, month, day, hour, min, sec] = dob.split("/").map(Number);

    // PHASE 1: Descent — subtract 10 with borrow in base-91
    let y = year - 10;
    let mo = month - 10;
    let d = day - 10;
    let h = hour - 10;
    let mi = min - 10;
    let s = sec - 10;

    if (s < 0) { s += future; mi--; }
    if (mi < 0) { mi += future; h--; }
    if (h < 0) { h += future; d--; }
    if (d < 0) { d += future; mo--; }
    if (mo < 0) { mo += future; y--; }

    while (mo > 12) { mo -= 12; y++; }
    if (mo <= 0) { mo += 12; y--; }

    const G = `${y}${String(mo).padStart(2, "0")}${String(d).padStart(2, "0")}${String(h).padStart(2, "0")}${String(mi).padStart(2, "0")}${String(s).padStart(2, "0")}`;

    // PHASE 2: Ascension — add 91
    let y2 = y + future;
    let mo2 = mo + future;
    let d2 = d + future;
    let h2 = h + future;
    let mi2 = mi + future;
    let s2 = s + future;

    while (mo2 > 12) { mo2 -= 12; y2++; }
    if (mo2 <= 0) { mo2 += 12; y2--; }

    const H = `${y2}${String(mo2).padStart(2, "0")}${String(d2).padStart(2, "0")}${String(h2).padStart(2, "0")}${String(mi2).padStart(2, "0")}${String(s2).padStart(2, "0")}`;

    // PHASE 3: Absolute time from Year 1 AD
    const T = this.timestampBigInt();

    const bigG = BigInt(G);
    const bigH = BigInt(H);

    // PHASE 4: Cosmic entanglement
    const TG = T + bigG;
    const TH = T + bigH;
    const TMG = T * bigG;
    const TMH = T * bigH;

    const cross1 = TG * TMH;
    const cross2 = TH * TMG;

    let soul = T + cross1 + cross2 + TG + TH + TMG + TMH;

    // PHASE 5: Eternal signature
    const sep = this.hashSha256(".");
    return [
      this.hashSha256("0001"),
      this.hashSha256(soul.toString()),
      this.hashSha256("01"),
      this.hashSha256(G),
      this.hashSha256("01"),
      this.hashSha256(H),
      this.hashSha256("01"),
      this.hashSha256(dob),
      this.hashSha256("01"),
      this.hashSha256(T.toString()),
      this.hashSha256("01"),
      this.hashSha256(String(future)),
    ].join(sep);
  }

  // Validate DOB format + real date
  validformat(dob: string): boolean {
    const regex = /^(\d{4})\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/([01]\d|2[0-3])\/([0-5]\d)\/([0-5]\d)$/;
    if (!regex.test(dob)) return false;

    const [_, y, m, d, h, min, s] = dob.match(regex)!;
    const date = new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`);
    return (
      date.getFullYear() === Number(y) &&
      date.getMonth() + 1 === Number(m) &&
      date.getDate() === Number(d)
    );
  }

  // Absolute timestamp since Year 1 AD (BigInt)
  timestampBigInt(): bigint {
    return BigInt(Date.now()) + this.YEAR_ONE_OFFSET;
  }

  timestamp(): number {
    return Number(this.timestampBigInt());
  }
  encryptSha256(data: any): string {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    return sjcl.encrypt(this.key, stringData);
  }

  decryptSha256(encrypted: string): any {
    try {
      const decrypted = sjcl.decrypt(this.key, encrypted);
      // Try to parse JSON, fallback to raw string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (err) {
      console.error('Decryption failed:', err);
      throw err;
    }
  }
  encryptWithKey(key: string, data: any): string {
    return sjcl.encrypt(key, JSON.stringify(data));
  }
  decryptWithKey(key: string, data: any): string {
    return sjcl.decrypt(key, data);
  }
}
