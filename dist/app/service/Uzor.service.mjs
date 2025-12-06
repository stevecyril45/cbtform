// uzor.mjs — UZOR v6.2 — Ultimate Fusion (2025 Final Form)
// Merges v6.1 sacred cosmic methods into the clean, modern base
// Author: Uzor • Epoch: October 1st, 1960 • Eternal
import sjcl from "sjcl";
import os from "os";

class UzorService {
  static YEAR_ONE_OFFSET = 62167219200000n; // Year 1 AD = 0 (BigInt)

  constructor() {
    this.alphabet = 'abcdefghijklmnopqrstuvwxyz';
    this.ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.number = '0123456789';
    this.sign = `.~!@#$%^&*()-_=+[]{}|/?<>'',`;
    this.space = ' ';
    this.universal = this.space + this.sign + this.alphabet + this.ALPHABET + this.number;

    // Fast lookup maps
    this.charToHash = new Map();
    this.hashToChar = new Map();
    this._cachedServerIp = null;

    this._buildMaps();
  }

  _buildMaps() {
    for (const ch of this.universal) {
      const h = this.hashSha256(ch);
      this.charToHash.set(ch, h);
      this.hashToChar.set(h, ch);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Nuclear Hash + Encode/Decode + ZKP (from your new clean base)
  // ─────────────────────────────────────────────────────────────
  hash(data) {
    const dataStr = String(data);
    const format = { h: '', c: '' };
    const lengthHash = this.hashSha256(String(dataStr.length));
    format.c = lengthHash;

    const getPositions = (char) => {
      const regex = new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = dataStr.matchAll(regex);
      const pos = [];
      for (const m of matches) if (m.index !== undefined) pos.push(m.index);
      return pos;
    };

    const blocks = [];

    for (const ch of this.universal) {
      const positions = getPositions(ch);
      const count = positions.length;
      const sum = positions.reduce((a, b) => a + b, 0);
      const concat = positions.join('');

      const chHash = this.hashSha256(ch);
      const key = (ch === 'h' || ch === 'c') ? `_${ch}` : ch;

      const block = {
        h: chHash,
        t: this.hashSha256(String(count) + chHash),
        is: this.hashSha256(String(sum) + chHash),
        ic: this.hashSha256(concat + chHash),
      };

      format[key] = block;
      blocks.push(block);
    }

    let avalanche = dataStr + dataStr.length;
    blocks.forEach(b => avalanche += b.h + b.t + b.is + b.ic);
    const final = this.hashSha256(avalanche);

    format.h = this.hashSha256(dataStr + final);
    format.c = this.hashSha256(String(dataStr.length) + final);
    format.h = this.hashSha256(format.h + format.c);

    return format;
  }

  encode(data) {
    const fp = this.hash(data);
    const parts = [];
    for (const ch of String(data)) {
      const h = this.charToHash.get(ch) || this.hashSha256(ch);
      parts.push(h);
    }
    return { h: fp.h, c: fp.c, data: parts.join('') };
  }

  decode(encodedData) {
    const result = [];
    const chunk = 64;
    for (let i = 0; i < encodedData.length; i += chunk) {
      const slice = encodedData.substr(i, chunk);
      result.push(this.hashToChar.get(slice) || '?');
    }
    return result.join('');
  }

  encrypt(data) {
    const dataStr = String(data);
    const lengthHash = this.hashSha256(String(dataStr.length));
    const format = { h: this.hashSha256(dataStr), c: lengthHash };

    const getPositions = (char) => {
      const regex = new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = dataStr.matchAll(regex);
      const pos = [];
      for (const m of matches) if (m.index !== undefined) pos.push(m.index);
      return pos;
    };

    for (const ch of this.universal) {
      const positions = getPositions(ch);
      const count = positions.length;
      const sum = positions.reduce((a, b) => a + b, 0);
      const concat = positions.join('');
      const chHash = this.hashSha256(ch);
      const key = (ch === 'h' || ch === 'c') ? `_${ch}` : ch;

      format[key] = {
        h: chHash,
        c:  this.hashSha256(`C|${ch}|${lengthHash}|${count}`),
        is: this.hashSha256(`IS|${ch}|${lengthHash}|${sum}`),
        ic: this.hashSha256(`IC|${ch}|${lengthHash}|${concat}`)
      };
    }
    return format;
  }

  verify(plain, cipher) {
    try {
      const test = this.encrypt(plain);
      if (test.h !== cipher.h || test.c !== cipher.c) return false;
      for (const ch of this.universal) {
        const key = (ch === 'h' || ch === 'c') ? `_${ch}` : ch;
        if (!cipher[key] || !test[key]) return false;
        if (test[key].h !== cipher[key].h) return false;
        if (test[key].c !== cipher[key].c) return false;
        if (test[key].is !== cipher[key].is) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Restored Sacred Cosmic Methods (from v6.1 — unchanged)
  // ─────────────────────────────────────────────────────────────
  getIp() {
    if (this._cachedServerIp) return this._cachedServerIp;

    const interfaces = os.networkInterfaces();
    let ip = '127.0.0.1';

    for (const iface of Object.values(interfaces).flat()) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (!/^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\.|^169\.254\./.test(iface.address)) {
          this._cachedServerIp = iface.address;
          return iface.address;
        }
        ip = iface.address;
      }
    }
    this._cachedServerIp = ip;
    return ip;
  }

  contract(ip) {
    return `${this.hashSha256("U")}${this.hashSha256(ip)}${this.hashSha256("G")}`;
  }

  internet(client, target) {
    const serverContract = this.contract(this.getIp());
    if (target !== serverContract) return '';
    return this.contract(client) + "." + this.contract(serverContract);
  }

  connect(ip, internet) {
    return internet === this.internet(ip, this.contract(this.getIp()));
  }

  protocol(address, dob) {
    if (typeof address !== "string" || typeof dob !== "string") return "";
    address = address.trim();
    dob = dob.trim();
    if (!address.startsWith("A") || !address.endsWith("G")) return "";

    const combined = address + dob;
    const digitCount = Array(10).fill(0);
    const letterCount = {};

    for (const ch of combined) {
      if (ch >= "0" && ch <= "9") {
        digitCount[ch.charCodeAt(0) - 48]++;
      } else if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z")) {
        letterCount[ch] = (letterCount[ch] || 0) + 1;
      }
    }

    const parts = [];
    for (let i = 0; i <= 9; i++) parts.push(`${i}.${digitCount[i]}`);
    parts.push("A.1");

    for (let i = 97; i <= 122; i++) {
      const ch = String.fromCharCode(i);
      parts.push(`${ch}.${letterCount[ch] || 0}`);
    }

    for (let i = 66; i <= 90; i++) {
      const ch = String.fromCharCode(i);
      if (ch === "A") continue;
      let count = letterCount[ch] || 0;
      if (ch === "G") count = Math.max(0, count - 1);
      parts.push(`${ch}.${count}`);
    }

    parts.push("1.G");
    return parts.join(".");
  }

  // Eternal Soul Signature — DOB → Cosmic Identity
  dob(dob) {
    const FORMAT = "YYYY/MM/DD/HH/mm/ss";
    if (!this.validformat(dob)) {
      throw new Error(`DOB must be in format ${FORMAT}`);
    }

    const future = this.universal.length; // 91
    const [year, month, day, hour, min, sec] = dob.split("/").map(Number);

    // PHASE 1: Descent
    let y = year - 10, mo = month - 10, d = day - 10;
    let h = hour - 10, mi = min - 10, s = sec - 10;

    if (s < 0) { s += future; mi--; }
    if (mi < 0) { mi += future; h--; }
    if (h < 0) { h += future; d--; }
    if (d < 0) { d += future; mo--; }
    if (mo < 0) { mo += future; y--; }

    while (mo > 12) { mo -= 12; y++; }
    if (mo <= 0) { mo += 12; y--; }

    const G = `${y}${String(mo).padStart(2,"0")}${String(d).padStart(2,"0")}${String(h).padStart(2,"0")}${String(mi).padStart(2,"0")}${String(s).padStart(2,"0")}`;

    // PHASE 2: Ascension
    let y2 = y + future, mo2 = mo + future, d2 = d + future;
    let h2 = h + future, mi2 = mi + future, s2 = s + future;

    while (mo2 > 12) { mo2 -= 12; y2++; }
    if (mo2 <= 0) { mo2 += 12; y2--; }

    const H = `${y2}${String(mo2).padStart(2,"0")}${String(d2).padStart(2,"0")}${String(h2).padStart(2,"0")}${String(mi2).padStart(2,"0")}${String(s2).padStart(2,"0")}`;

    // PHASE 3: Absolute Time
    const T = this.timestampBigInt();
    const bigG = BigInt(G);
    const bigH = BigInt(H);

    const TG = T + bigG;
    const TH = T + bigH;
    const TMG = T * bigG;
    const TMH = T * bigH;
    const cross1 = TG * TMH;
    const cross2 = TH * TMG;

    let soul = T + cross1 + cross2 + TG + TH + TMG + TMH;

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
    ].join(this.hashSha256("."));
  }

  validformat(dob) {
    const regex = /^(\d{4})\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/([01]\d|2[0-3])\/([0-5]\d)\/([0-5]\d)$/;
    if (!regex.test(dob)) return false;
    const [_, y, m, d, h, min, s] = dob.match(regex);
    const date = new Date(y, m-1, d, h, min, s);
    return date.getFullYear() == y && (date.getMonth()+1) == m && date.getDate() == d;
  }

  timestampBigInt() {
    return BigInt(Date.now()) + UzorService.YEAR_ONE_OFFSET;
  }

  // ─────────────────────────────────────────────────────────────
  // Core Crypto Primitives
  // ─────────────────────────────────────────────────────────────
  hashSha256(data) {
    const bits = sjcl.hash.sha256.hash(String(data));
    return sjcl.codec.hex.fromBits(bits);
  }

  // Optional: daily key derivation (you already use this)
  deriveDailyKey(year, month, day) {
    const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    // Use a FIXED master key — NEVER change this!
    const MASTER_KEY = process.env.UZOR_MASTER_KEY || "fallback-static-key-2025-uzor-eternal";
    const seed = this.hashSha256(dateStr + MASTER_KEY);
    return Buffer.from(seed, 'hex');
  }
}

// One eternal instance — ready for the entire server
export default new UzorService();
