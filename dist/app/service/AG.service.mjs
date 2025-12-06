// AGService.mjs — Universal + Async Media Offloading (2025)
// LMDB + Bloom Filter + Daily Shards + Safe Base64 → File + UUID filenames
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import UzorService from "./Uzor.service.mjs";
import { open } from "lmdb-store";
import fileDirName from "../../file-dir-name.mjs";
import { setTimeout as delay } from 'timers/promises';
import { randomUUID } from 'crypto';

dotenv.config();
const { __dirname } = fileDirName(import.meta);
const STORAGE_ROOT = path.normalize(`${__dirname}/../../storage`);
const UPLOADS_DIR = path.join(STORAGE_ROOT, "uploads");

// Ensure uploads folder exists at startup
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Bloom Filter (unchanged)
// ---------------------------------------------------------------------------
class BloomFilter {
  constructor(expected = 25_000_000, errorRate = 0.008) {
    this.size = Math.ceil((expected * Math.abs(Math.log2(errorRate))) / 0.693147);
    this.hashes = Math.ceil(Math.log2(1 / errorRate));
    this.bits = Buffer.alloc(Math.ceil(this.size / 8), 0);
  }
  _hash(str, seed) {
    let h = BigInt(seed);
    for (let i = 0; i < str.length; i++) {
      h = (h * 31n) + BigInt(str.charCodeAt(i));
    }
    return Number(h % BigInt(this.size));
  }
  add(item) {
    const str = String(item);
    for (let i = 0; i < this.hashes; i++) {
      const pos = this._hash(str, i);
      this.bits[pos >> 3] |= 1 << (pos & 7);
    }
  }
  mightContain(item) {
    const str = String(item);
    for (let i = 0; i < this.hashes; i++) {
      const pos = this._hash(str, i);
      if (!(this.bits[pos >> 3] & (1 << (pos & 7)))) return false;
    }
    return true;
  }
  clear() { this.bits.fill(0); }
}

// ---------------------------------------------------------------------------
// AGService — UNIVERSAL + SAFE MEDIA HANDLING
// ---------------------------------------------------------------------------
class AGService {
  constructor() {
    this.uzor = UzorService;
    this.dbs = new Map();
    this.blooms = new Map();
    this.migrationDone = new Set();
    this.collections = new Map();
  }

  // =======================================================================
  // 1. Define collection
  // =======================================================================
  defineCollection(name, config = {}) {
    this.collections.set(name, {
      unique: Array.isArray(config.unique) ? config.unique : [],
      indexed: Array.isArray(config.indexed) ? config.indexed : [],
      searchPrefix: Array.isArray(config.searchPrefix) ? config.searchPrefix : [],
      bloomSize: config.bloomSize || 25_000_000,
      bloomErrorRate: config.bloomErrorRate || 0.008,
    });
  }

  _getCollectionConfig(collection) {
    const cfg = this.collections.get(collection);
    if (!cfg) throw new Error(`Collection "${collection}" not defined. Call defineCollection() first.`);
    return cfg;
  }

  // =======================================================================
  // Helpers
  // =======================================================================
  _key(service, year, month, day) {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${service}:${year}:${m}:${d}`;
  }

  _formatDate(year, month, day) {
    return { y: String(year), m: String(month).padStart(2, "0"), d: String(day).padStart(2, "0") };
  }

  getDateParts(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return { year, month, day };
  }

  async _getDb(service, year, month, day) {
    const key = this._key(service, year, month, day);
    if (this.dbs.has(key)) return this.dbs.get(key);

    const { y, m, d } = this._formatDate(year, month, day);
    const dir = path.join(STORAGE_ROOT, service, y, m, d);
    const dbPath = path.join(dir, "data.lmdb");
    const encryptionKey = this.uzor.deriveDailyKey(year, month, day);

    // ─────── WINDOWS-SPECIFIC HELL FIX ───────
    await fs.promises.mkdir(dir, { recursive: true });

    // Give Windows + Defender + Explorer + OneDrive time to chill
    if (process.platform === "win32") {
      console.log(`Windows detected → applying 1.5 second anti-lock delay for ${dir}`);
      await delay(1500);           // ← THIS IS THE MAGIC NUMBER
    }

    let db;
    for (let i = 0; i < 15; i++) {  // 15 retries = ~15 seconds max
      try {
        db = open({
          path: dbPath,
          encryptionKey,
          compression: true,
          mapSize: 1099511627776n,
          maxDbs: 16,
          maxReaders: 256,
          noSubdir: true,
          useWritemap: true,
          // These two lines are CRUCIAL on Windows
          noSync: false,
          noMetaSync: false,
        });
        this.dbs.set(key, db);
        console.log(`LMDB opened successfully: ${dbPath}`);
        return db;
      } catch (err) {
        console.warn(`LMDB open attempt ${i + 1}/15 failed → ${err.message}`);
        if (i === 14) {
          throw new Error(`Failed to open LMDB after 15 attempts → ${dbPath}`);
        }
        // Exponential + jitter delay
        await delay(1000 + i * 500 + Math.random() * 400);
      }
    }
  }

  _getBloom(service, year, month, day, bloomConfig) {
    const key = this._key(service, year, month, day);
    if (!this.blooms.has(key)) {
      const bloom = new BloomFilter(bloomConfig.bloomSize, bloomConfig.bloomErrorRate);
      this.blooms.set(key, bloom);
      this._warmBloomFromDb(service, year, month, day, bloomConfig);
    }
    return this.blooms.get(key);
  }

  async _warmBloomFromDb(service, year, month, day, config) {
    const db = await this._getDb(service, year, month, day);
    const bloom = this._getBloom(service, year, month, day, config);
    try {
      for (const field of config.unique) {
        for (const { value: id } of db.getRange({ start: `${field}:`, end: `${field}:\xff` })) {
          const rec = await db.get(`id:${id}`);
          if (rec && typeof rec === "object" && rec[field] !== undefined) bloom.add(rec[field]);
        }
      }
    } catch { /* empty */ }
  }

  // =======================================================================
  // 2. INSERT — with safe async media offloading
  // =======================================================================
  async insert(collection, data) {
    const { year, month, day } = this.getDateParts();
    const config = this._getCollectionConfig(collection);

    if (!data.id) {
      return { success: false, error: "Generate a transaction ID" };
    }
    data.hash = UzorService.hashSha256(data.id);
    data._insertedAt = Date.now();
    data._date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const db = await this._getDb(collection, year, month, day);
    const bloom = this._getBloom(collection, year, month, day, config);

    // Deduplication
    for (const field of config.unique) {
      if (data[field] !== undefined) {
        const val = String(data[field]);
        if (bloom.mightContain(val)) {
          const existing = await this.getByField(collection, year, month, day, field, val);
          if (existing) return { success: false, error: `Duplicate ${field}: ${val}`, existing };
        }
        bloom.add(val);
      }
    }

    // Detect data URLs (image_* or video_* fields)
    const mediaFields = Object.keys(data).filter(key =>
      (key.startsWith("image_") || key.startsWith("video_")) &&
      typeof data[key] === "string" &&
      data[key].startsWith("data:")
    );

    // Store placeholders + original data URLs temporarily
    const originalMedia = new Map();
    for (const field of mediaFields) {
      originalMedia.set(field, data[field]);
      data[field] = null; // will be replaced later
    }

    // Write main record (without huge base64)
    await db.put(`id:${data.id}`, data);

    const allIndexedFields = [...new Set([...config.unique, ...config.indexed])];
    for (const field of allIndexedFields) {
      if (data[field] !== undefined) {
        await db.put(`${field}:${data[field]}`, data.id);
      }
    }

    // Offload media processing to background (non-blocking)
// Offload media processing to background (non-blocking)
if (mediaFields.length > 0) {
  (async () => {
    // Keep a copy of the ORIGINAL full data (before stripping base64)
    const originalFullRecord = { ...data };

    for (const field of mediaFields) {
      try {
        const dataUrl = originalMedia.get(field);
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) continue;

        const mime = match[1];
        const base64 = match[2];
        const buffer = Buffer.from(base64, "base64");
        const ext = mime.split("/")[1]?.split("+")[0] || "bin";
        const filename = `${randomUUID()}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        await fs.promises.writeFile(filePath, buffer);

        // Re-open DB
        const updateDb = await this._getDb(collection, year, month, day);

        // Get current record (could have been updated by other fields already)
        let current = await updateDb.get(`id:${data.id}`);
        if (!current || typeof current !== "object") {
          current = { ...originalFullRecord }; // fallback to original
        } else {
          // Merge with original in case some fields were null'd
          current = { ...originalFullRecord, ...current };
        }

        const oldValue = current[field];
        current[field] = filename;

        // Save full merged record
        await updateDb.put(`id:${data.id}`, current);

        // Update index
        if (allIndexedFields.includes(field)) {
          if (oldValue && typeof oldValue === "string") {
            await updateDb.remove(`${field}:${oldValue}`);
          }
          await updateDb.put(`${field}:${filename}`, data.id);
        }

        console.log(`Uploaded → ${data.id} | ${field} = ${filename}`);
      } catch (err) {
        console.error(`Media failed: ${field} in ${data.id}`, err);
      }
    }
  })().catch(err => console.error("Media worker crashed:", err));
}

    return { success: true, id: data.id };
  }

  // =======================================================================
  // 3. Lookup helpers
  // =======================================================================
  async getByField(collection, year, month, day, field, value) {
    const db = await this._getDb(collection, year, month, day);
    const id = await db.get(`${field}:${value}`);
    return id ? await db.get(`id:${id}`) : null;
  }

  async search(collection, year, month, day, field, prefix, limit = 50) {
    const config = this._getCollectionConfig(collection);
    if (!config.searchPrefix.includes(field) && !config.unique.includes(field) && !config.indexed.includes(field)) {
      throw new Error(`Prefix search not allowed on "${field}" in "${collection}"`);
    }
    const db = await this._getDb(collection, year, month, day);
    const results = [];
    for (const { value: id } of db.getRange({
      start: `${field}:${prefix}`,
      end: `${field}:${prefix}\xff`,
      limit,
    })) {
      const rec = await db.get(`id:${id}`);
      if (rec && typeof rec === "object") results.push(rec);
    }
    return results;
  }

  async getDay(collection, year, month, day) {
    const db = await this._getDb(collection, year, month, day);
    const results = [];
    for (const { value } of db.getRange({ start: "id:", end: "id:\xff" })) {
      if (value && typeof value === "object") results.push(value);
    }
    return results;
  }

  async getById(collection, year, month, day, id) {
    const db = await this._getDb(collection, year, month, day);
    const rec = await db.get(`id:${id}`);
    return (rec && typeof rec === "object") ? rec : null;
  }

  // =======================================================================
  // 4. Migration & cleanup
  // =======================================================================
  async migrateOldDay(service, year, month, day) {
    const key = this._key(service, year, month, day);
    if (this.migrationDone.has(key)) return;

    const { y, m, d } = this._formatDate(year, month, day);
    const oldPath = path.join(STORAGE_ROOT, service, y, m, d, "db.json");
    if (!fs.existsSync(oldPath)) return;

    console.log(`Migrating ${service} ${y}-${m}-${d} JSON → LMDB`);
    const raw = fs.readFileSync(oldPath, "utf-8");
    let records = [];

    try {
      const json = JSON.parse(raw);
      for (const chunk of json.records || []) {
        try {
          const decrypted = this.uzor.decryptSha256(chunk);
          const arr = JSON.parse(decrypted);
          if (Array.isArray(arr)) records.push(...arr);
        } catch {}
      }
    } catch (e) {
      console.warn("Corrupted db.json, skipping");
      return;
    }

    for (const rec of records) await this.insert(service, rec);
    this.migrationDone.add(key);
    console.log(`Migrated ${records.length} records`);
  }

  async close() {
    for (const db of this.dbs.values()) {
      try { await db.close(); } catch {}
    }
    this.dbs.clear();
    this.blooms.clear();
    console.log("AGService: All DBs closed");
  }
}

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------
// export default new AGService(); // singleton if you prefer
export default AGService;
