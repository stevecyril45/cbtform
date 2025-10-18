import path from "path";
import fs from "fs";
import fileDirName from "../../file-dir-name.mjs";
import dotenv from "dotenv";
dotenv.config();
const { __dirname } = fileDirName(import.meta);
const STORAGE_ROOT = path.normalize(`${__dirname}/../../storage`);
const ERROR_LOG_PATH = path.normalize(`${STORAGE_ROOT}/error.log`);
const MAX_RECORDS_PER_FILE = process.env.MAX_RECORDS_PER_FILE || 1000; // Configurable maximum records per file

class DBService {
  // Static promise to cache initialization (singleton pattern)
  static initializationPromise = null;

  // Static cache for latest files per dbName (in-memory, single-process)
  static latestFilesCache = new Map(); // dbName -> { path: string, recordsCount: number, timestamp: number }

  // Static promise chain for serializing writes to db.json
  static dbWritePromise = Promise.resolve();

  // Static method: Initialize main storage/db.json if it doesn't exist (called once)
  static async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise; // Return cached promise (no re-init)
    }

    this.initializationPromise = (async () => {
      const dbPath = path.join(STORAGE_ROOT, 'db.json');
      try {
        await fs.promises.access(dbPath);
        // Validate existing file
        const existingContent = await fs.promises.readFile(dbPath, 'utf-8');
        JSON.parse(existingContent); // Throws if malformed
      } catch {
        const templateData = { records: [] };
        this.dbWritePromise = this.dbWritePromise.then(() => this.atomicWrite(dbPath, templateData));
        await this.dbWritePromise;
        console.log(`Initialized storage/db.json`);
      }
    })();

    return this.initializationPromise;
  }

  // Helper: Atomic write (write to .tmp then rename for safety)
  static async atomicWrite(filePath, data) {
    const tmpPath = filePath + '.tmp';
    try {
      // Pre-write cleanup: remove stale tmp if exists
      await fs.promises.unlink(tmpPath).catch(() => {}); // Ignore if missing

      const jsonString = JSON.stringify(data, null, 2);
      await fs.promises.writeFile(tmpPath, jsonString);
      // Validate written tmp file
      const tmpContent = await fs.promises.readFile(tmpPath, 'utf-8');
      JSON.parse(tmpContent); // Throws if malformed
      await fs.promises.rename(tmpPath, filePath);
    } catch (err) {
      // Cleanup tmp on error
      try { await fs.promises.unlink(tmpPath); } catch {}
      console.error(`Atomic write failed for ${filePath}:`, err);
      throw err;
    }
  }

  // Helper: Get all JSON files under a directory (recursive, sorted by timestamp desc)
  static async getJsonFilesUnder(dir) {
    const allFiles = await this.getAllFiles(dir);
    let jsonFiles = allFiles.filter((file) => file.endsWith('.json'));
    // Sort by timestamp descending
    jsonFiles.sort((a, b) => {
      const tsA = parseInt(path.basename(a, '.json'));
      const tsB = parseInt(path.basename(b, '.json'));
      return tsB - tsA;
    });
    return jsonFiles;
  }

  // Static method: Schema - Returns the content of db.json
  static async schema() {
    const dbPath = path.join(STORAGE_ROOT, 'db.json');
    try {
      const fileContent = await fs.promises.readFile(dbPath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      if (!parsed.records || !Array.isArray(parsed.records)) {
        throw new Error('Invalid schema structure');
      }
      return parsed;
    } catch (err) {
      console.error("Error reading schema (db.json):", err);
      // Reset to valid empty schema on failure
      const validSchema = { records: [] };
      this.dbWritePromise = this.dbWritePromise.then(() => this.atomicWrite(dbPath, validSchema));
      await this.dbWritePromise;
      console.log(`Reset invalid schema to valid empty:`, validSchema);
      return validSchema;
    }
  }

  // Static method: Create db folder if it doesn't exist, and register schema in db.json
  static async create(dbName, schemaObj = {}) {
    // Extract unique fields from schemaObj (assume {unique: [...]})
    const uniqueFields = schemaObj.unique || [];

    // Serialize the entire read-modify-write operation
    this.dbWritePromise = this.dbWritePromise.then(async () => {
      const dbPath = path.join(STORAGE_ROOT, 'db.json');
      let schemaData;
      try {
        const fileContent = await fs.promises.readFile(dbPath, 'utf-8');
        schemaData = JSON.parse(fileContent);
        if (!schemaData.records || !Array.isArray(schemaData.records)) {
          throw new Error('Invalid schema structure');
        }
      } catch {
        schemaData = { records: [] };
      }

      // Check if dbName already exists; if so, update unique fields
      const existingIndex = schemaData.records.findIndex(rec => rec.name === dbName);
      if (existingIndex !== -1) {
        schemaData.records[existingIndex].unique = uniqueFields;
      } else {
        schemaData.records.push({ name: dbName, unique: uniqueFields });
      }

      // Validate before write
      JSON.stringify(schemaData); // Should not throw for plain obj

      await this.atomicWrite(dbPath, schemaData);
      console.log(`Registered/Updated schema for ${dbName} in db.json`);
    });
    await this.dbWritePromise;

    // Handle storage: create folder if needed, check/set latest file or create new if full/no files
    const dbDir = path.join(STORAGE_ROOT, dbName);
    let jsonFiles = [];
    let needsNewFile = true;
    try {
      await fs.promises.access(dbDir);
      const allFiles = await this.getAllFiles(dbDir);
      jsonFiles = allFiles.filter((file) => file.endsWith('.json'));
      if (jsonFiles.length > 0) {
        // Sort descending by timestamp
        jsonFiles.sort((a, b) => {
          const tsA = parseInt(path.basename(a, '.json'));
          const tsB = parseInt(path.basename(b, '.json'));
          return tsB - tsA;
        });
        const latestFile = jsonFiles[0];
        const fileContent = await fs.promises.readFile(latestFile, 'utf-8');
        const content = JSON.parse(fileContent);
        const recordCount = content.records ? content.records.length : 0;
        if (recordCount < MAX_RECORDS_PER_FILE) {
          // Use existing latest file
          this.latestFilesCache.set(dbName, { path: latestFile, recordsCount: recordCount, timestamp: Date.now() });
          needsNewFile = false;
          console.log(`Resumed with existing latest file for ${dbName}: ${recordCount}/${MAX_RECORDS_PER_FILE} records`);
        }
      }
    } catch (err) {
      // Directory doesn't exist or no access
      console.log(`Directory for ${dbName} does not exist, creating...`);
    }

    if (needsNewFile) {
      // Create folder if not exists
      try {
        await fs.promises.access(dbDir);
      } catch {
        await fs.promises.mkdir(dbDir, { recursive: true });
        console.log(`Created folder: ${dbDir}`);
      }
      // Create new file
      await this.createFirstFile(dbName);
      console.log(`Created new first file for ${dbName}`);
    }

    return true;
  }

  // Static method: "Delete" by renaming to hidden folder
  static async delete(dbName) {
    const dir = path.join(STORAGE_ROOT, dbName);
    const hiddenDir = path.join(STORAGE_ROOT, `.${dbName}`);
    try {
      await fs.promises.access(dir);
      await fs.promises.rename(dir, hiddenDir);
      // Clear cache
      this.latestFilesCache.delete(dbName);
      // Optionally remove from schema, but keeping for history
      console.log(`Hidden folder: ${dir} -> ${hiddenDir}`);
      return true;
    } catch (err) {
      console.error("Error hiding folder:", err);
      return false;
    }
  }

  // Static method: Get day folder path
  static read(dbName, year, month, day) {
    return path.join(STORAGE_ROOT, dbName, year, month, day);
  }

// Static method: Get all records from all JSON files in a month (flattened into days array)
static async all(dbName, year, month) {
  const monthDir = path.join(STORAGE_ROOT, dbName, year, month);
  const allRecords = [];
  try {
    const entries = await fs.promises.readdir(monthDir, { withFileTypes: true });
    const dayDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort(); // Sort days numerically

    for (const day of dayDirs) {
      const dayDir = path.join(monthDir, day);
      // Get all JSON files under day dir (recursive)
      const allFiles = await this.getAllFiles(dayDir);
      const jsonFiles = allFiles.filter((file) => file.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const fileContent = await fs.promises.readFile(file, 'utf-8');
          const content = JSON.parse(fileContent);
          if (content.records && Array.isArray(content.records)) {
            allRecords.push(...content.records);
          }
        } catch (fileErr) {
          console.error(`Error processing file ${file}:`, fileErr.message);
          // Continue to next file
        }
      }
    }
  } catch (err) {
    console.error("Error reading month folders:", err);
  }
  return allRecords;
}
  // Static method: Validate unique fields across all records in the DB
  static async validateUnique(dbName, record) {
    const schema = await this.schema();
    const dbSchema = schema.records.find(rec => rec.name === dbName);
    if (!dbSchema || !dbSchema.unique || dbSchema.unique.length === 0) {
      return { valid: true, errors: [] }; // No unique constraints
    }

    const uniqueFields = dbSchema.unique;
    const errors = [];
    const dbDir = path.join(STORAGE_ROOT, dbName);

    // Get all JSON files recursively
    let allFiles = await this.getAllFiles(dbDir);
    let jsonFiles = allFiles.filter((file) => file.endsWith('.json'));

    for (const uniqueField of uniqueFields) {
      const value = record[uniqueField];
      if (value === undefined || value === null) {
        errors.push(`${uniqueField} is required for uniqueness check`);
        continue;
      }

      let found = false;
      for (const file of jsonFiles) {
        try {
          const fileContent = await fs.promises.readFile(file, 'utf-8');
          const content = JSON.parse(fileContent);
          if (content.records && Array.isArray(content.records)) {
            const existing = content.records.find(r => r[uniqueField] === value);
            if (existing) {
              found = true;
              break;
            }
          }
        } catch (fileErr) {
          console.error(`Error checking file ${file}:`, fileErr.message);
          // Continue to next file
        }
      }

      if (found) {
        errors.push(`${uniqueField} "${value}" already exists`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Static method: Update record in specific day's files
  static async update(dbName, year, month, day, id, data) {
    const dayDir = DBService.read(dbName, year, month, day);
    try {
      await fs.promises.access(dayDir);
    } catch {
      return false;
    }

    // Get all JSON files under day dir (now recursive for hours)
    const jsonFiles = await this.getJsonFilesUnder(dayDir);

    for (const file of jsonFiles) {
      try {
        const fileContent = await fs.promises.readFile(file, 'utf-8');
        const content = JSON.parse(fileContent);
        if (content.records && Array.isArray(content.records)) {
          const index = content.records.findIndex((record) => record.id === id);
          if (index !== -1) {
            content.records[index] = data; // Replace with full updated data
            await this.atomicWrite(file, content);
            console.log(`Updated record ${id} in ${file}`);
            // Invalidate cache for this dbName
            this.latestFilesCache.delete(dbName);
            return true;
          }
        }
      } catch (fileErr) {
        console.error(`Error processing file ${file}:`, fileErr.message);
        // Continue to next file
      }
    }
    return false;
  }

  // Static method: Insert record into latest file or create new if full
  static async insert(dbName, record) {
    // Validate unique fields first
    const validation = await this.validateUnique(dbName, record);
    if (!validation.valid) {
      console.error("Insert failed due to unique constraint violations:", validation.errors);
      return { success: false, errors: validation.errors };
    }

    const dbDir = path.join(STORAGE_ROOT, dbName);
    try {
      await fs.promises.access(dbDir);
    } catch {
      await DBService.create(dbName);
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');

    // Check cache for latest file
    let latestFile = null;
    let content = null;
    const cacheEntry = this.latestFilesCache.get(dbName);
    if (cacheEntry && cacheEntry.timestamp > now.getTime() - 60000) { // Cache valid for 1 min
      try {
        await fs.promises.access(cacheEntry.path);
        const fileContent = await fs.promises.readFile(cacheEntry.path, 'utf-8');
        content = JSON.parse(fileContent);
        if (content.records.length < MAX_RECORDS_PER_FILE) {
          latestFile = cacheEntry.path;
        } else {
          this.latestFilesCache.delete(dbName); // Invalidate
        }
      } catch {
        this.latestFilesCache.delete(dbName); // Invalidate on error
      }
    }

    // If no valid cache, full scan
    if (!latestFile) {
      let allFiles = await this.getAllFiles(dbDir);
      let jsonFiles = allFiles.filter((file) => file.endsWith('.json'));
      if (jsonFiles.length === 0) {
        // Create first file
        await this.createFirstFile(dbName);
        allFiles = await this.getAllFiles(dbDir);
        jsonFiles = allFiles.filter((file) => file.endsWith('.json'));
      }
      jsonFiles.sort((a, b) => {
        const tsA = parseInt(path.basename(a, '.json'));
        const tsB = parseInt(path.basename(b, '.json'));
        return tsB - tsA;
      });
      latestFile = jsonFiles[0];
      try {
        const fileContent = await fs.promises.readFile(latestFile, 'utf-8');
        content = JSON.parse(fileContent);
      } catch (err) {
        console.error("Error reading latest file:", err);
        return { success: false, error: 'Failed to read latest file' };
      }
    }

    if (content.records.length >= MAX_RECORDS_PER_FILE) {
      // Create new file with hour subdir
      const timestamp = now.getTime();
      const newFileName = `${timestamp}.json`;
      const newFilePath = path.join(dbDir, year, month, day, hour, newFileName);
      const newDir = path.dirname(newFilePath);
      await fs.promises.mkdir(newDir, { recursive: true });

      const filename = timestamp.toString();
      const index = 0;
      const id = `${filename}${day}${month}${year}${index}`;
      record.id = id;

      content = { records: [record] };
      await this.atomicWrite(newFilePath, content);
      console.log(`Created new file ${newFilePath} and inserted record ${id}`);

      // Update cache
      this.latestFilesCache.set(dbName, { path: newFilePath, recordsCount: 1, timestamp: now.getTime() });
    } else {
      // Append to latest
      const filename = path.basename(latestFile, '.json');
      const index = content.records.length;
      const id = `${filename}${day}${month}${year}${index}`;
      record.id = id;

      content.records.push(record);
      await this.atomicWrite(latestFile, content);
      console.log(`Appended record ${id} to ${latestFile}`);

      // Update cache
      this.latestFilesCache.set(dbName, { path: latestFile, recordsCount: content.records.length, timestamp: now.getTime() });
    }
    return { success: true };
  }

  // Static helper: Recursive get all files
  static async getAllFiles(dir) {
    const results = [];
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...(await DBService.getAllFiles(fullPath)));
        } else {
          results.push(fullPath);
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err);
    }
    return results;
  }

  // Static helper: Create first file for a db (now with hour)
  static async createFirstFile(dbName) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const timestamp = now.getTime();

    const dbDir = path.join(STORAGE_ROOT, dbName);
    const filePath = path.join(dbDir, year, month, day, hour, `${timestamp}.json`);
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });

    const templateData = { records: [] };
    await this.atomicWrite(filePath, templateData);
    console.log(`Created first file: ${filePath}`);

    // Init cache
    this.latestFilesCache.set(dbName, { path: filePath, recordsCount: 0, timestamp: now.getTime() });
  }
}

export default DBService;
