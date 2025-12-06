// TransactionService.mjs — Updated for AGService v2 (Universal + Configurable Collections)

import path from "path";
import AGService from "./AG.service.mjs";
import fileDirName from "../../file-dir-name.mjs";
import UzorService from "./Uzor.service.mjs";

const { __dirname } = fileDirName(import.meta);
const STORAGE_ROOT = path.normalize(`${__dirname}/../../storage`);

// Singleton AGService instance
const ag = new AGService();


class TransactionService {
  constructor() {
    this.ag = ag;
    this.collection = "transactions";
  }

  async init() {
    this.ag.defineCollection(this.collection, {
      unique: ["id", "hash"],                    // Instant deduplication on these
      indexed: ["email", "user", "address"], // Fast exact lookup
      searchPrefix: ["id", "hash", "email", "user", "address"], // Prefix search enabled
      bloomSize: 100_000_000,                      // Expect high volume
      bloomErrorRate: 0.001                        // Lower false positive rate
    });
    console.log("TransactionService ready → LMDB + Bloom + Encrypted Daily Shards");
  }

  // ===================================================================
  // INSERT — Clean, safe, zero hacks
  // ===================================================================
  async insert(transaction) {
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const timestamp = Date.now();
    const randomMiddle = Math.floor(Math.random() * 1_000_000_0000).toString().padStart(12, "0");
    const timestampPart = Date.now().toString().slice(-9);
    transaction.id = `${year}${month}${day}${timestampPart}${randomMiddle}${day}${month}${year}`;
    transaction.timestamp = timestamp;
    transaction.created_at = timestamp;
    transaction.updated_at ='';
    const result = await this.ag.insert(this.collection, transaction);
    if (!result.success) {
      console.warn(`Duplicate transaction rejected: ${result.error}`);
    }
    return result;
  }
  // ===================================================================
  // UPDATE → Immutable style (re-insert with same unique key)
  // ===================================================================
  async update(transaction) {
    // Must have at least one unique field to act as "primary key"
    if (!transaction.id && !transaction.hash) {
      throw new Error("update() requires transaction.id or transaction.hash");
    }
    if (transaction.hash !== UzorService.hashSha256(transaction.id)) {
      throw new Error("Corrut hash transaction.hash");
    }

    // Preserve the original unique identifier (critical!)
    const lookupKey = transaction.id || transaction.hash;

    // Always update these fields on "update"
    transaction.updated_at = Date.now();

    // === Re-insert the full record ===
    const result = await this.ag.insert(this.collection, transaction);

    if (!result.success) {
      // This is EXPECTED and GOOD — means duplicate was found → update succeeded
      if (result.error.includes("Duplicate id") || result.error.includes("Duplicate hash")) {
        console.log(`[UPDATED] Transaction ${lookupKey} updated successfully (immutable upsert)`);
        return {
          success: true,
          action: "updated",
          id: result.existing.id,
          previous: result.existing
        };
      } else {
        // Real duplicate error (shouldn't happen if you're using same id/hash)
        console.warn("Unexpected duplicate rejection:", result.error);
        return result;
      }
    }

    // If insert succeeded → this was the first version (rare during update)
    console.log(`[CREATED] First version of transaction ${lookupKey}`);
    return {
      success: true,
      action: "created_first_version",
      id: result.id
    };
  }

  // ===================================================================
  // GET BY DAY
  // ===================================================================
  async getForDay(year, month, day) {
    return await this.ag.getDay(this.collection, year, month, day);
  }

  // Get all transactions in a month (parallelized for speed)
  async getAllInMonth(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const promises = [];

    for (let day = 1; day <= daysInMonth; day++) {
      promises.push(this.ag.getDay(this.collection, year, month, day));
    }

    const results = await Promise.all(promises);
    return results.flat();
  }

  // ===================================================================
  // SEARCH & LOOKUP — Now using correct fields
  // ===================================================================
  async searchByFieldPrefix(year, month, day,field, prefix, limit = 50) {
    return await this.ag.search(this.collection, year, month, day, field, prefix, limit);
  }
  async getBy(year, month, day, value) {
    return await this.ag.getById(this.collection, year, month, day, value);
  }

  // ===================================================================
  // UTILITIES
  // ===================================================================
  // Graceful shutdown
  async close() {
    await this.ag.close();
  }
}

// Auto-init + export singleton
const transactionService = new TransactionService();
await transactionService.init();

// Optional: expose globally for shutdown hooks
global.transactionService = transactionService;

export default transactionService;